import { DATA_BACKENDS, getPreferredDataBackend } from '../../shared/constants/backend'
import { isDeleteField, stripUndefinedValues } from '../../shared/helpers/deleteField'
import { createTimestamp, mapTimestampFields } from '../../shared/helpers/timestamps'
import { getSupabaseClient } from '../client'

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getRoleEmail(role: number, profile: Record<string, any>) {
  return role === 2 ? profile.email : profile.correo || profile.email
}

function normalizePatch(profileData: Record<string, any>) {
  return Object.entries(profileData).reduce<Record<string, any>>((accumulator, [key, value]) => {
    if (value === undefined) {
      return accumulator
    }

    accumulator[key] = typeof value === 'string' ? value.trim() : value
    return accumulator
  }, {})
}

function getRelatedRow(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function mapUserRow(row: any) {
  if (!row) {
    return null
  }

  const student = getRelatedRow(row.student_profiles)
  const company = getRelatedRow(row.company_profiles)
  const professor = getRelatedRow(row.professor_profiles)
  const savedOfferIds = Array.isArray(row.saved_offers)
    ? row.saved_offers.map((item: any) => item.offer_id).filter(Boolean)
    : []

  const base = {
    id: row.id,
    uid: row.id,
    rol: row.role,
    email: row.email,
    authEmail: row.email,
    photoURL: row.photo_url,
    savedOfferIds,
    ...(row.profile_data || {}),
  }

  const mappedProfile = {
    ...base,
    ...(student
      ? {
          nombre: student.first_name,
          apellido: student.last_name,
          universidad: student.university,
          carrera: student.degree,
          bio: student.bio,
          cvUrl: student.cv_url,
          cvFileName: student.cv_file_name,
          cvPublicId: student.cv_public_id,
          cvUpdatedAt: student.cv_updated_at,
          cvData: student.cv_data,
        }
      : {}),
    ...(company
      ? {
          nombreEmpresa: company.company_name,
          sector: company.sector,
          email: company.contact_email || row.email,
          descripcionEmpresa: company.description,
          ubicaciones: Array.isArray(company.company_locations)
            ? company.company_locations.map((location: any) => ({
                id: location.id,
                nombre: location.name,
                ciudad: location.city,
                pais: location.country,
                latitud: location.latitude,
                longitud: location.longitude,
                tipo: location.location_type,
              }))
            : [],
        }
      : {}),
    ...(professor
      ? {
          nombreCompleto: professor.full_name,
          correo: professor.contact_email || row.email,
          telefono: professor.phone,
          areaEducativa: professor.education_area,
        }
      : {}),
  }

  return mapTimestampFields({
    ...mappedProfile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

async function getFirebaseUserById(uid: string) {
  const { doc, getDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

async function upsertFirebaseUserProfile(uid: string, profileData: Record<string, any>) {
  const { deleteField, doc, serverTimestamp, setDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const sanitizedProfile = normalizePatch(profileData)
  const firebasePayload = Object.entries(sanitizedProfile).reduce<Record<string, any>>(
    (accumulator, [key, value]) => {
      accumulator[key] = isDeleteField(value) ? deleteField() : value
      return accumulator
    },
    {},
  )

  await setDoc(
    doc(db, 'users', uid),
    {
      ...firebasePayload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return sanitizedProfile
}

async function deleteFirebaseUserProfile(uid: string) {
  const { deleteDoc, doc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await deleteDoc(doc(db, 'users', uid))
}

async function addFirebaseSavedOffer(studentId: string, offerId: string) {
  const { arrayUnion, doc, serverTimestamp, setDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await setDoc(
    doc(db, 'users', studentId),
    {
      savedOfferIds: arrayUnion(offerId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

async function removeFirebaseSavedOffer(studentId: string, offerId: string) {
  const { arrayRemove, doc, serverTimestamp, setDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await setDoc(
    doc(db, 'users', studentId),
    {
      savedOfferIds: arrayRemove(offerId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserById(uid: string) {
  if (!uid) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return getFirebaseUserById(uid)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      *,
      student_profiles(*),
      company_profiles(*, company_locations(*)),
      professor_profiles(*),
      saved_offers(offer_id)
    `,
    )
    .eq('id', uid)
    .maybeSingle()

  if (error) {
    throw error
  }

  return mapUserRow(data)
}

export async function upsertUserProfile(uid: string, profileData: Record<string, any>) {
  if (!uid) {
    throw new Error('No authenticated user was found.')
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return upsertFirebaseUserProfile(uid, profileData)
  }

  const supabase = getSupabaseClient()
  const sanitizedProfile = normalizePatch(profileData)
  const existingProfile = await getUserById(uid)
  const role = Number(sanitizedProfile.rol || existingProfile?.rol || 1)
  const email = normalizeString(getRoleEmail(role, sanitizedProfile) || existingProfile?.email)
  const now = createTimestamp()
  const existingProfileData = existingProfile
    ? Object.entries(existingProfile).reduce<Record<string, any>>((accumulator, [key, value]) => {
        if (!['id', 'uid', 'createdAt', 'updatedAt', 'savedOfferIds'].includes(key)) {
          accumulator[key] = value
        }

        return accumulator
      }, {})
    : {}

  const nextProfileData = {
    ...existingProfileData,
    ...stripUndefinedValues(sanitizedProfile),
  }

  Object.entries(sanitizedProfile).forEach(([key, value]) => {
    if (isDeleteField(value)) {
      delete nextProfileData[key]
    }
  })

  const { error: userError } = await supabase.from('users').upsert({
    id: uid,
    email: email || existingProfile?.email || null,
    role,
    photo_url: sanitizedProfile.photoURL || existingProfile?.photoURL || null,
    profile_data: nextProfileData,
    updated_at: now,
  })

  if (userError) {
    throw userError
  }

  if (role === 1) {
    const { error } = await supabase.from('student_profiles').upsert({
      user_id: uid,
      first_name: sanitizedProfile.nombre ?? existingProfile?.nombre ?? '',
      last_name: sanitizedProfile.apellido ?? existingProfile?.apellido ?? '',
      university: sanitizedProfile.universidad ?? existingProfile?.universidad ?? '',
      degree: sanitizedProfile.carrera ?? existingProfile?.carrera ?? '',
      bio: sanitizedProfile.bio ?? existingProfile?.bio ?? '',
      cv_url: sanitizedProfile.cvUrl ?? existingProfile?.cvUrl ?? null,
      cv_file_name: sanitizedProfile.cvFileName ?? existingProfile?.cvFileName ?? null,
      cv_public_id: sanitizedProfile.cvPublicId ?? existingProfile?.cvPublicId ?? null,
      cv_updated_at: sanitizedProfile.cvUpdatedAt ?? existingProfile?.cvUpdatedAt ?? null,
      cv_data: sanitizedProfile.cvData ?? existingProfile?.cvData ?? null,
      updated_at: now,
    })

    if (error) {
      throw error
    }
  }

  if (role === 2) {
    const { error } = await supabase.from('company_profiles').upsert({
      user_id: uid,
      company_name: sanitizedProfile.nombreEmpresa ?? existingProfile?.nombreEmpresa ?? '',
      sector: sanitizedProfile.sector ?? existingProfile?.sector ?? '',
      contact_email: sanitizedProfile.email ?? existingProfile?.email ?? email,
      description: sanitizedProfile.descripcionEmpresa ?? existingProfile?.descripcionEmpresa ?? '',
      updated_at: now,
    })

    if (error) {
      throw error
    }

    if (Array.isArray(sanitizedProfile.ubicaciones)) {
      await supabase.from('company_locations').delete().eq('company_id', uid)

      if (sanitizedProfile.ubicaciones.length) {
        const { error: locationsError } = await supabase.from('company_locations').insert(
          sanitizedProfile.ubicaciones.map((location: any) => ({
            id: location.id,
            company_id: uid,
            name: location.nombre,
            city: location.ciudad,
            country: location.pais,
            latitude: Number(location.latitud),
            longitude: Number(location.longitud),
            location_type: location.tipo,
          })),
        )

        if (locationsError) {
          throw locationsError
        }
      }
    }
  }

  if (role === 3) {
    const { error } = await supabase.from('professor_profiles').upsert({
      user_id: uid,
      full_name: sanitizedProfile.nombreCompleto ?? existingProfile?.nombreCompleto ?? '',
      contact_email: sanitizedProfile.correo ?? existingProfile?.correo ?? email,
      phone: sanitizedProfile.telefono ?? existingProfile?.telefono ?? '',
      education_area: sanitizedProfile.areaEducativa ?? existingProfile?.areaEducativa ?? '',
      updated_at: now,
    })

    if (error) {
      throw error
    }
  }

  return sanitizedProfile
}

export async function deleteUserProfile(uid: string) {
  if (!uid) {
    throw new Error('No se encontro un usuario autenticado.')
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return deleteFirebaseUserProfile(uid)
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('users').delete().eq('id', uid)

  if (error) {
    throw error
  }
}

export async function addSavedOffer(studentId: string, offerId: string) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return addFirebaseSavedOffer(studentId, offerId)
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('saved_offers').upsert({
    student_id: studentId,
    offer_id: offerId,
  })

  if (error) {
    throw error
  }
}

export async function removeSavedOffer(studentId: string, offerId: string) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return removeFirebaseSavedOffer(studentId, offerId)
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('saved_offers')
    .delete()
    .eq('student_id', studentId)
    .eq('offer_id', offerId)

  if (error) {
    throw error
  }
}
