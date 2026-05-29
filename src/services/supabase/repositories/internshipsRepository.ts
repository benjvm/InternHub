import { DATA_BACKENDS, getPreferredDataBackend } from '../../shared/constants/backend'
import { createTimestamp, mapTimestampFields } from '../../shared/helpers/timestamps'
import { getSupabaseClient } from '../client'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function mapInternshipRow(row: any) {
  if (!row) {
    return null
  }

  const requiredHours = row.required_hours ?? row.total_hours ?? null

  return mapTimestampFields({
    id: row.id,
    applicationId: row.application_id,
    studentId: row.student_id,
    companyId: row.company_id,
    offerId: row.offer_id,
    professorId: row.professor_id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    requiredHours,
    totalHours: row.total_hours ?? requiredHours,
    completedHours: Number(row.completed_hours || 0),
    tutorCompanyName: row.tutor_company_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUpdate: row.last_update,
  })
}

function mapDailyLogRow(row: any) {
  if (!row) {
    return null
  }

  return mapTimestampFields({
    id: row.date,
    date: row.date,
    description: row.description,
    hoursWorked: row.hours_worked,
    type: row.log_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapInternshipDocument(documentSnapshot: any) {
  const data = documentSnapshot.data()
  const requiredHours = data.requiredHours ?? data.totalHours ?? data.weeklyHours ?? null

  return {
    id: documentSnapshot.id,
    ...data,
    requiredHours,
    totalHours: data.totalHours ?? requiredHours,
    completedHours: Number(data.completedHours || 0),
  }
}

function mapDailyLogDocument(snapshot: any) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    date: data.date || snapshot.id,
  }
}

async function getFirebaseInternshipsByField(field: string, value: string) {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDocs(query(collection(db, 'internships'), where(field, '==', value)))
  return snapshot.docs.map(mapInternshipDocument)
}

async function getFirebaseInternshipById(internshipId: string) {
  const { doc, getDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDoc(doc(db, 'internships', internshipId))
  return snapshot.exists() ? mapInternshipDocument(snapshot) : null
}

async function getFirebaseAllInternships() {
  const { collection, getDocs } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDocs(collection(db, 'internships'))
  return snapshot.docs.map(mapInternshipDocument)
}

async function createFirebaseInternship(payload: Record<string, any>) {
  const { collection, doc, serverTimestamp, setDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const internshipReference = doc(collection(db, 'internships'))
  const firebasePayload = {
    id: internshipReference.id,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(internshipReference, firebasePayload)

  return {
    id: internshipReference.id,
    ...firebasePayload,
  }
}

async function updateFirebaseInternship(internshipId: string, payload: Record<string, any>) {
  const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await updateDoc(doc(db, 'internships', internshipId), {
    ...payload,
    updatedAt: serverTimestamp(),
    lastUpdate: payload.lastUpdate || serverTimestamp(),
  })
}

async function assignFirebaseProfessor(internshipId: string, professorId: string) {
  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const internshipRef = doc(db, 'internships', internshipId)

  await runTransaction(db, async (transaction: any) => {
    const internshipSnapshot = await transaction.get(internshipRef)

    if (!internshipSnapshot.exists()) {
      throw new Error('La practica seleccionada ya no esta disponible.')
    }

    const internshipData = internshipSnapshot.data()
    const currentProfessorId = normalizeText(internshipData.professorId)

    if (currentProfessorId && currentProfessorId !== professorId) {
      throw new Error('Esta practica ya tiene otro profesor responsable asignado.')
    }

    transaction.update(internshipRef, {
      professorId,
      updatedAt: serverTimestamp(),
      lastUpdate: serverTimestamp(),
    })
  })
}

async function getFirebaseDailyLogs(internshipId: string) {
  const { collection, doc, getDocs, query } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const dailyLogsQuery = query(collection(doc(db, 'internships', internshipId), 'dailyLogs'))
  const snapshot = await getDocs(dailyLogsQuery)
  return snapshot.docs.map(mapDailyLogDocument)
}

async function createFirebaseDailyLog(internshipId: string, dailyLog: Record<string, any>) {
  const { doc, increment, runTransaction, serverTimestamp } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const internshipRef = doc(db, 'internships', internshipId)
  const dailyLogRef = doc(internshipRef, 'dailyLogs', dailyLog.date)

  await runTransaction(db, async (transaction: any) => {
    const internshipSnapshot = await transaction.get(internshipRef)

    if (!internshipSnapshot.exists()) {
      throw new Error('La practica ya no esta disponible.')
    }

    const dailyLogSnapshot = await transaction.get(dailyLogRef)

    if (dailyLogSnapshot.exists()) {
      throw new Error('Ese dia ya esta registrado. No es posible guardarlo dos veces.')
    }

    transaction.set(dailyLogRef, {
      date: dailyLog.date,
      description: dailyLog.description,
      hoursWorked: dailyLog.hoursWorked,
      type: dailyLog.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    transaction.update(internshipRef, {
      completedHours: increment(dailyLog.hoursWorked),
      updatedAt: serverTimestamp(),
      lastUpdate: serverTimestamp(),
    })
  })
}

function getTimestampValue(timestamp: any) {
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000
  }

  if (typeof timestamp === 'string' || timestamp instanceof Date) {
    const dateValue = new Date(timestamp).getTime()
    return Number.isNaN(dateValue) ? 0 : dateValue
  }

  return 0
}

function sortInternshipsByNewest(internships: any[]) {
  return internships.sort(
    (left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt),
  )
}

async function getSupabaseInternshipsByColumn(column: string, value: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq(column, value)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapInternshipRow)
}

export async function getInternshipRecordByApplicationId(applicationId: string) {
  if (!applicationId) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    const [internship] = await getFirebaseInternshipsByField('applicationId', applicationId)
    return internship || null
  }

  const [internship] = await getSupabaseInternshipsByColumn('application_id', applicationId)
  return internship || null
}

export async function getInternshipRecordByOfferAndStudent(offerId: string, studentId: string) {
  if (!offerId || !studentId) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    const internships = await getFirebaseInternshipsByField('offerId', offerId)
    return internships.find((internship: any) => internship.studentId === studentId) || null
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq('offer_id', offerId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return mapInternshipRow(data)
}

export async function createInternshipRecord(payload: Record<string, any>) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return createFirebaseInternship(payload)
  }

  const now = createTimestamp()
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internships')
    .insert({
      application_id: payload.applicationId,
      student_id: payload.studentId,
      company_id: payload.companyId,
      offer_id: payload.offerId,
      professor_id: payload.professorId,
      status: payload.status,
      start_date: payload.startDate,
      end_date: payload.endDate,
      required_hours: payload.requiredHours,
      total_hours: payload.totalHours,
      completed_hours: payload.completedHours || 0,
      tutor_company_name: payload.tutorCompanyName,
      notes: payload.notes,
      created_at: now,
      updated_at: now,
      last_update: payload.lastUpdate,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapInternshipRow(data)
}

export async function getInternshipRecordsByCompanyId(companyId: string) {
  if (!companyId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortInternshipsByNewest(await getFirebaseInternshipsByField('companyId', companyId))
  }

  return getSupabaseInternshipsByColumn('company_id', companyId)
}

export async function getInternshipRecordsByStudentId(studentId: string) {
  if (!studentId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortInternshipsByNewest(await getFirebaseInternshipsByField('studentId', studentId))
  }

  return getSupabaseInternshipsByColumn('student_id', studentId)
}

export async function getInternshipRecordsByProfessorId(professorId: string) {
  if (!professorId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortInternshipsByNewest(await getFirebaseInternshipsByField('professorId', professorId))
  }

  return getSupabaseInternshipsByColumn('professor_id', professorId)
}

export async function getInternshipRecordsWithoutProfessor() {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortInternshipsByNewest(
      (await getFirebaseAllInternships()).filter(
        (internship: any) => !normalizeText(internship.professorId),
      ),
    )
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .is('professor_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapInternshipRow)
}

export async function getInternshipRecordById(internshipId: string) {
  if (!internshipId) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return getFirebaseInternshipById(internshipId)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq('id', internshipId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return mapInternshipRow(data)
}

export async function updateInternshipRecord(internshipId: string, payload: Record<string, any>) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return updateFirebaseInternship(internshipId, payload)
  }

  const supabase = getSupabaseClient()
  const updatePayload: Record<string, any> = {
    updated_at: createTimestamp(),
    last_update: createTimestamp(),
  }

  if ('startDate' in payload) updatePayload.start_date = payload.startDate
  if ('endDate' in payload) updatePayload.end_date = payload.endDate
  if ('totalHours' in payload) updatePayload.total_hours = payload.totalHours
  if ('requiredHours' in payload) updatePayload.required_hours = payload.requiredHours
  if ('tutorCompanyName' in payload) updatePayload.tutor_company_name = payload.tutorCompanyName
  if ('notes' in payload) updatePayload.notes = payload.notes
  if ('status' in payload) updatePayload.status = payload.status
  if ('professorId' in payload) updatePayload.professor_id = payload.professorId
  if ('completedHours' in payload) updatePayload.completed_hours = payload.completedHours

  const { error } = await supabase.from('internships').update(updatePayload).eq('id', internshipId)

  if (error) {
    throw error
  }
}

export async function assignProfessorRecord(internshipId: string, professorId: string) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return assignFirebaseProfessor(internshipId, professorId)
  }

  const supabase = getSupabaseClient()
  const currentInternship = await getInternshipRecordById(internshipId)

  if (!currentInternship) {
    throw new Error('La practica seleccionada ya no esta disponible.')
  }

  if (currentInternship.professorId && currentInternship.professorId !== professorId) {
    throw new Error('Esta practica ya tiene otro profesor responsable asignado.')
  }

  await updateInternshipRecord(internshipId, { professorId })
}

export async function getDailyLogRecords(internshipId: string) {
  if (!internshipId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return (await getFirebaseDailyLogs(internshipId)).sort((left: any, right: any) =>
      left.date.localeCompare(right.date),
    )
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('internship_daily_logs')
    .select('*')
    .eq('internship_id', internshipId)
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map(mapDailyLogRow)
}

export async function createDailyLogRecord(internshipId: string, dailyLog: Record<string, any>) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    await createFirebaseDailyLog(internshipId, dailyLog)
    return dailyLog
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('create_internship_daily_log', {
    target_internship_id: internshipId,
    log_date: dailyLog.date,
    log_description: dailyLog.description,
    log_hours_worked: dailyLog.hoursWorked,
    log_type_value: dailyLog.type,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese dia ya esta registrado. No es posible guardarlo dos veces.')
    }

    throw error
  }

  return dailyLog
}
