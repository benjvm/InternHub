import 'dotenv/config'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import admin from 'firebase-admin'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceAccountPath) {
  throw new Error('Define FIREBASE_SERVICE_ACCOUNT_PATH con la ruta al JSON de service account.')
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Define VITE_SUPABASE_URL/SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.')
}

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const firestore = admin.firestore()
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const firebaseUidMap = new Map()
const authUsersByEmail = new Map()
const authUsersByLegacyFirebaseUid = new Map()
const savedOffersQueue = []
let mappingTableAvailable = null
const counters = {
  usersCreated: 0,
  usersReused: 0,
  usersSkipped: 0,
  recordsUpserted: 0,
  recordsSkipped: 0,
  recoverableErrors: 0,
}

function logInfo(message) {
  console.log(`[INFO] ${message}`)
}

function logWarn(message) {
  counters.recoverableErrors += 1
  console.warn(`[WARN] ${message}`)
}

function normalizeRole(profile = {}) {
  return Number(profile.rol || profile.role || 1)
}

function getEmail(profile = {}) {
  const email = profile.email || profile.correo || profile.authEmail || null
  return typeof email === 'string' ? email.trim().toLowerCase() : null
}

function toIsoTimestamp(value) {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  return null
}

function normalizeDate(value) {
  const isoValue = toIsoTimestamp(value)

  if (isoValue) {
    return isoValue.slice(0, 10)
  }

  return typeof value === 'string' && value ? value : null
}

function getSupabaseUserIdByFirebaseUid(firebaseUid) {
  if (!firebaseUid) {
    return null
  }

  return firebaseUidMap.get(firebaseUid) || null
}

function isDuplicateAuthError(error) {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  return (
    code.includes('email_exists') ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('duplicate')
  )
}

async function upsert(table, payload, conflictColumn = 'id', context = table) {
  const { error } = await supabase.from(table).upsert(payload, { onConflict: conflictColumn })

  if (error) {
    logWarn(`${context}: no se pudo upsert en ${table}. ${error.message}`)
    return false
  }

  counters.recordsUpserted += 1
  return true
}

async function deleteBy(table, column, value, context = table) {
  const { error } = await supabase.from(table).delete().eq(column, value)

  if (error) {
    logWarn(`${context}: no se pudo limpiar ${table}.${column}. ${error.message}`)
    return false
  }

  return true
}

async function tableExists(table) {
  const { error } = await supabase.from(table).select('*').limit(1)
  return !error
}

async function hasMappingTable() {
  if (mappingTableAvailable === null) {
    mappingTableAvailable = await tableExists('firebase_user_mapping')
  }

  return mappingTableAvailable
}

async function buildAuthUserIndex() {
  logInfo('Indexando usuarios existentes de Supabase Auth...')
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw error
    }

    for (const user of data.users || []) {
      if (user.email) {
        authUsersByEmail.set(user.email.trim().toLowerCase(), user)
      }

      const legacyFirebaseUid = user.user_metadata?.legacy_firebase_uid

      if (legacyFirebaseUid) {
        authUsersByLegacyFirebaseUid.set(legacyFirebaseUid, user)
        firebaseUidMap.set(legacyFirebaseUid, user.id)
      }
    }

    if (!data.users?.length || data.users.length < perPage) {
      break
    }

    page += 1
  }

  logInfo(`Usuarios Auth indexados: ${authUsersByEmail.size}`)
}

async function loadExistingMappings() {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, legacy_firebase_uid')
    .not('legacy_firebase_uid', 'is', null)

  if (usersError) {
    logWarn(`No se pudieron leer users.legacy_firebase_uid: ${usersError.message}`)
  } else {
    for (const user of users || []) {
      firebaseUidMap.set(user.legacy_firebase_uid, user.id)

      if (user.email && !authUsersByEmail.has(user.email.toLowerCase())) {
        authUsersByEmail.set(user.email.toLowerCase(), { id: user.id, email: user.email })
      }
    }
  }

  if (!(await hasMappingTable())) {
    logWarn(
      'La tabla firebase_user_mapping no existe. Se continuara con users.legacy_firebase_uid y metadata de Auth.',
    )
    return
  }

  const { data: mappings, error } = await supabase
    .from('firebase_user_mapping')
    .select('firebase_uid, supabase_user_id')

  if (error) {
    logWarn(`No se pudo leer firebase_user_mapping: ${error.message}`)
    return
  }

  for (const mapping of mappings || []) {
    firebaseUidMap.set(mapping.firebase_uid, mapping.supabase_user_id)
  }
}

async function persistUserMapping(firebaseUid, supabaseUserId, email) {
  firebaseUidMap.set(firebaseUid, supabaseUserId)

  if (!(await hasMappingTable())) {
    return
  }

  await upsert(
    'firebase_user_mapping',
    {
      firebase_uid: firebaseUid,
      supabase_user_id: supabaseUserId,
      email,
      updated_at: new Date().toISOString(),
    },
    'firebase_uid',
    `mapping usuario ${firebaseUid}`,
  )
}

async function createAuthUser({ firebaseUid, email, role }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      role,
      legacy_firebase_uid: firebaseUid,
      requires_password_reset: true,
    },
  })

  if (!error) {
    counters.usersCreated += 1
    logInfo(`Usuario creado en Supabase Auth: ${firebaseUid} -> ${data.user.id}`)
    return data.user
  }

  if (!isDuplicateAuthError(error)) {
    throw error
  }

  const existingUser = authUsersByEmail.get(email)

  if (existingUser) {
    counters.usersReused += 1
    logInfo(`Usuario reutilizado por email duplicado: ${firebaseUid} -> ${existingUser.id}`)
    return existingUser
  }

  logWarn(
    `Supabase informo email duplicado para ${email}, pero no se encontro en el indice local. Reintentando listUsers.`,
  )
  await buildAuthUserIndex()
  return authUsersByEmail.get(email) || null
}

async function resolveSupabaseAuthUser({ firebaseUid, email, role }) {
  if (firebaseUidMap.has(firebaseUid)) {
    const userId = firebaseUidMap.get(firebaseUid)
    counters.usersReused += 1
    logInfo(`Usuario reutilizado por mapping: ${firebaseUid} -> ${userId}`)
    return { id: userId, email }
  }

  const legacyUser = authUsersByLegacyFirebaseUid.get(firebaseUid)

  if (legacyUser) {
    counters.usersReused += 1
    logInfo(`Usuario reutilizado por metadata legacy_firebase_uid: ${firebaseUid} -> ${legacyUser.id}`)
    return legacyUser
  }

  if (email && authUsersByEmail.has(email)) {
    const existingUser = authUsersByEmail.get(email)
    counters.usersReused += 1
    logInfo(`Usuario reutilizado por email: ${firebaseUid} -> ${existingUser.id}`)
    return existingUser
  }

  if (!email) {
    counters.usersSkipped += 1
    logWarn(`Usuario omitido sin email: ${firebaseUid}`)
    return null
  }

  try {
    const user = await createAuthUser({ firebaseUid, email, role })

    if (user?.email) {
      authUsersByEmail.set(user.email.trim().toLowerCase(), user)
    }

    if (user?.id) {
      authUsersByLegacyFirebaseUid.set(firebaseUid, user)
    }

    return user
  } catch (error) {
    counters.usersSkipped += 1
    logWarn(`Usuario omitido por error Auth ${firebaseUid} (${email}): ${error.message}`)
    return null
  }
}

async function migrateUsers() {
  logInfo('Migrando usuarios y perfiles...')
  const snapshot = await firestore.collection('users').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const firebaseUid = documentSnapshot.id
    const role = normalizeRole(data)
    const email = getEmail(data)
    const authUser = await resolveSupabaseAuthUser({ firebaseUid, email, role })

    if (!authUser?.id) {
      counters.recordsSkipped += 1
      continue
    }

    const userId = authUser.id
    await persistUserMapping(firebaseUid, userId, email || authUser.email || null)

    const userUpserted = await upsert(
      'users',
      {
        id: userId,
        email: email || authUser.email || null,
        role,
        legacy_firebase_uid: firebaseUid,
        photo_url: data.photoURL || data.photoUrl || null,
        profile_data: data,
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
        updated_at: toIsoTimestamp(data.updatedAt) || new Date().toISOString(),
      },
      'id',
      `usuario ${firebaseUid}`,
    )

    if (!userUpserted) {
      counters.recordsSkipped += 1
      continue
    }

    if (role === 1) {
      await upsert(
        'student_profiles',
        {
          user_id: userId,
          first_name: data.nombre || '',
          last_name: data.apellido || '',
          university: data.universidad || '',
          degree: data.carrera || data.degree || '',
          bio: data.bio || '',
          cv_url: data.cvUrl || null,
          cv_file_name: data.cvFileName || null,
          cv_public_id: data.cvPublicId || null,
          cv_updated_at: toIsoTimestamp(data.cvUpdatedAt),
          cv_data: data.cvData || null,
        },
        'user_id',
        `perfil estudiante ${firebaseUid}`,
      )
    }

    if (role === 2) {
      await upsert(
        'company_profiles',
        {
          user_id: userId,
          company_name: data.nombreEmpresa || data.companyName || '',
          sector: data.sector || '',
          contact_email: data.email || email,
          description: data.descripcionEmpresa || data.description || '',
        },
        'user_id',
        `perfil empresa ${firebaseUid}`,
      )

      if (Array.isArray(data.ubicaciones)) {
        await deleteBy('company_locations', 'company_id', userId, `ubicaciones empresa ${firebaseUid}`)
        const locations = data.ubicaciones.map((location) => ({
          id: location.id || crypto.randomUUID(),
          company_id: userId,
          name: location.nombre || location.name || '',
          city: location.ciudad || location.city || '',
          country: location.pais || location.country || '',
          latitude: Number(location.latitud ?? location.latitude ?? 0),
          longitude: Number(location.longitud ?? location.longitude ?? 0),
          location_type: location.tipo || location.type || 'Office',
        }))

        for (const location of locations) {
          await upsert(
            'company_locations',
            location,
            'id',
            `ubicacion ${location.id} empresa ${firebaseUid}`,
          )
        }
      }
    }

    if (role === 3) {
      await upsert(
        'professor_profiles',
        {
          user_id: userId,
          full_name: data.nombreCompleto || data.fullName || '',
          contact_email: data.correo || email,
          phone: data.telefono || data.phone || '',
          education_area: data.areaEducativa || data.educationalArea || '',
        },
        'user_id',
        `perfil profesor ${firebaseUid}`,
      )
    }

    if (Array.isArray(data.savedOfferIds)) {
      for (const offerId of data.savedOfferIds) {
        savedOffersQueue.push({
          student_id: userId,
          offer_id: offerId,
          firebase_uid: firebaseUid,
        })
      }
    }
  }
}

async function migrateOffers() {
  logInfo('Migrando ofertas...')
  const snapshot = await firestore.collection('offers').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const companyId = getSupabaseUserIdByFirebaseUid(data.companyId)

    await upsert(
      'offers',
      {
        id: documentSnapshot.id,
        company_id: companyId,
        company_name: data.companyName || 'Empresa de InternHub',
        title: data.title || '',
        category: data.category || '',
        description: data.description || '',
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
        location: data.location || '',
        location_id: data.locationId || null,
        location_details: data.ubicacion || null,
        salary: data.salary || '',
        modality: data.modality || '',
        icon: data.icon || 'business_center',
        status: data.status || 'published',
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
        updated_at: toIsoTimestamp(data.updatedAt) || new Date().toISOString(),
      },
      'id',
      `oferta ${documentSnapshot.id}`,
    )
  }
}

async function migrateSavedOffers() {
  logInfo('Migrando favoritos...')

  for (const savedOffer of savedOffersQueue) {
    await upsert(
      'saved_offers',
      {
        student_id: savedOffer.student_id,
        offer_id: savedOffer.offer_id,
      },
      'student_id,offer_id',
      `favorito ${savedOffer.firebase_uid} -> ${savedOffer.offer_id}`,
    )
  }
}

async function migrateApplications() {
  logInfo('Migrando postulaciones...')
  const snapshot = await firestore.collection('applications').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const studentId = getSupabaseUserIdByFirebaseUid(data.studentId)

    if (!studentId) {
      counters.recordsSkipped += 1
      logWarn(`Postulacion omitida sin mapping de estudiante: ${documentSnapshot.id}`)
      continue
    }

    const payload = {
      id: documentSnapshot.id,
      offer_id: data.offerId,
      student_id: studentId,
      status: data.status || 'pending',
      cover_letter: data.coverLetter || '',
      availability: data.availability || '',
      available_from_date: data.availableFromDate || '',
      schedule_type: data.scheduleType || '',
      cv_url: data.cvUrl || '',
      cv_file_name: data.cvFileName || '',
      created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
      updated_at: toIsoTimestamp(data.updatedAt) || new Date().toISOString(),
    }

    await upsert('applications', payload, 'id', `postulacion ${documentSnapshot.id}`)
  }
}

async function migrateInternships() {
  logInfo('Migrando practicas y daily logs...')
  const snapshot = await firestore.collection('internships').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const studentId = getSupabaseUserIdByFirebaseUid(data.studentId)

    if (!studentId) {
      counters.recordsSkipped += 1
      logWarn(`Practica omitida sin mapping de estudiante: ${documentSnapshot.id}`)
      continue
    }

    const internshipUpserted = await upsert(
      'internships',
      {
        id: documentSnapshot.id,
        application_id: data.applicationId || null,
        student_id: studentId,
        company_id: getSupabaseUserIdByFirebaseUid(data.companyId),
        offer_id: data.offerId || null,
        professor_id: getSupabaseUserIdByFirebaseUid(data.professorId),
        status: data.status || 'pendiente',
        start_date: normalizeDate(data.startDate),
        end_date: normalizeDate(data.endDate),
        required_hours: data.requiredHours || data.totalHours || null,
        total_hours: data.totalHours || data.requiredHours || null,
        completed_hours: Number(data.completedHours || 0),
        tutor_company_name: data.tutorCompanyName || '',
        notes: data.notes || '',
        last_update: toIsoTimestamp(data.lastUpdate),
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
        updated_at: toIsoTimestamp(data.updatedAt) || new Date().toISOString(),
      },
      'id',
      `practica ${documentSnapshot.id}`,
    )

    if (!internshipUpserted) {
      counters.recordsSkipped += 1
      continue
    }

    const dailyLogsSnapshot = await documentSnapshot.ref.collection('dailyLogs').get()

    for (const logSnapshot of dailyLogsSnapshot.docs) {
      const log = logSnapshot.data()
      const hoursWorked = Number(log.hoursWorked || 0)

      if (!Number.isFinite(hoursWorked) || hoursWorked <= 0) {
        logWarn(`Daily log omitido con horas invalidas: ${documentSnapshot.id}/${logSnapshot.id}`)
        counters.recordsSkipped += 1
        continue
      }

      await upsert(
        'internship_daily_logs',
        {
          internship_id: documentSnapshot.id,
          date: normalizeDate(log.date || logSnapshot.id),
          description: log.description || '',
          hours_worked: hoursWorked,
          log_type: log.type || 'remoto',
          created_at: toIsoTimestamp(log.createdAt) || new Date().toISOString(),
          updated_at: toIsoTimestamp(log.updatedAt) || new Date().toISOString(),
        },
        'internship_id,date',
        `daily log ${documentSnapshot.id}/${logSnapshot.id}`,
      )
    }
  }
}

async function migrateNotifications() {
  logInfo('Migrando notificaciones...')
  const snapshot = await firestore.collection('notifications').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const userId = getSupabaseUserIdByFirebaseUid(data.userId || data.recipientId || data.to)

    if (!userId) {
      counters.recordsSkipped += 1
      logWarn(`Notificacion omitida sin mapping de usuario: ${documentSnapshot.id}`)
      continue
    }

    await upsert(
      'notifications',
      {
        id: documentSnapshot.id,
        user_id: userId,
        title: data.title || data.titulo || 'Notificacion',
        body: data.body || data.message || data.mensaje || '',
        status: data.status || (data.read ? 'read' : 'unread'),
        metadata: data,
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
        read_at: toIsoTimestamp(data.readAt),
      },
      'id',
      `notificacion ${documentSnapshot.id}`,
    )
  }
}

async function migrateChats() {
  logInfo('Migrando chats y mensajes...')
  const snapshot = await firestore.collection('chats').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()
    const createdBy = getSupabaseUserIdByFirebaseUid(data.createdBy || data.created_by)

    const chatUpserted = await upsert(
      'chats',
      {
        id: documentSnapshot.id,
        offer_id: data.offerId || null,
        application_id: data.applicationId || null,
        created_by: createdBy,
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
        updated_at: toIsoTimestamp(data.updatedAt) || new Date().toISOString(),
      },
      'id',
      `chat ${documentSnapshot.id}`,
    )

    if (!chatUpserted) {
      counters.recordsSkipped += 1
      continue
    }

    const participantIds = Array.from(
      new Set([
        ...(Array.isArray(data.participantIds) ? data.participantIds : []),
        ...(Array.isArray(data.participants) ? data.participants : []),
        data.studentId,
        data.companyId,
        data.professorId,
        data.createdBy,
      ].filter(Boolean)),
    )

    for (const firebaseParticipantId of participantIds) {
      const participantId = getSupabaseUserIdByFirebaseUid(firebaseParticipantId)

      if (!participantId) {
        logWarn(`Participante de chat sin mapping: ${documentSnapshot.id}/${firebaseParticipantId}`)
        continue
      }

      await upsert(
        'chat_participants',
        {
          chat_id: documentSnapshot.id,
          user_id: participantId,
        },
        'chat_id,user_id',
        `participante chat ${documentSnapshot.id}/${firebaseParticipantId}`,
      )
    }

    const messagesSnapshot = await documentSnapshot.ref.collection('messages').get()

    for (const messageSnapshot of messagesSnapshot.docs) {
      const message = messageSnapshot.data()
      const senderId = getSupabaseUserIdByFirebaseUid(message.senderId || message.from)

      if (!senderId) {
        counters.recordsSkipped += 1
        logWarn(`Mensaje omitido sin mapping de remitente: ${documentSnapshot.id}/${messageSnapshot.id}`)
        continue
      }

      await upsert(
        'chat_messages',
        {
          id: messageSnapshot.id,
          chat_id: documentSnapshot.id,
          sender_id: senderId,
          body: message.body || message.text || message.message || '',
          metadata: message,
          created_at: toIsoTimestamp(message.createdAt) || new Date().toISOString(),
        },
        'id',
        `mensaje ${documentSnapshot.id}/${messageSnapshot.id}`,
      )
    }
  }
}

async function migrateActivityLogs() {
  logInfo('Migrando actividades...')
  const snapshot = await firestore.collection('activityLogs').get()

  for (const documentSnapshot of snapshot.docs) {
    const data = documentSnapshot.data()

    await upsert(
      'activity_logs',
      {
        id: documentSnapshot.id,
        actor_id: getSupabaseUserIdByFirebaseUid(data.actorId || data.userId),
        entity_type: data.entityType || data.type || 'activity',
        entity_id: data.entityId || null,
        action: data.action || 'migrated',
        metadata: data,
        created_at: toIsoTimestamp(data.createdAt) || new Date().toISOString(),
      },
      'id',
      `actividad ${documentSnapshot.id}`,
    )
  }
}

async function migrateIfCollectionExists(collectionName, migrateFn) {
  const snapshot = await firestore.collection(collectionName).limit(1).get()

  if (snapshot.empty) {
    logInfo(`Coleccion ${collectionName} vacia o inexistente. Omitida.`)
    return
  }

  await migrateFn()
}

await buildAuthUserIndex()
await loadExistingMappings()
await migrateUsers()
await migrateOffers()
await migrateSavedOffers()
await migrateApplications()
await migrateInternships()
await migrateIfCollectionExists('chats', migrateChats)
await migrateIfCollectionExists('notifications', migrateNotifications)
await migrateIfCollectionExists('activityLogs', migrateActivityLogs)

console.log('[OK] Migracion Firestore -> Supabase completada.')
console.log(`[OK] Usuarios creados: ${counters.usersCreated}`)
console.log(`[OK] Usuarios reutilizados: ${counters.usersReused}`)
console.log(`[OK] Usuarios omitidos: ${counters.usersSkipped}`)
console.log(`[OK] Registros upserted: ${counters.recordsUpserted}`)
console.log(`[OK] Registros omitidos: ${counters.recordsSkipped}`)
console.log(`[OK] Errores recuperables: ${counters.recoverableErrors}`)
