import { DATA_BACKENDS, getPreferredDataBackend } from '../../shared/constants/backend'
import { createTimestamp, mapTimestampFields } from '../../shared/helpers/timestamps'
import { getSupabaseClient } from '../client'

function mapApplicationRow(row: any) {
  if (!row) {
    return null
  }

  return mapTimestampFields({
    id: row.id,
    applicationId: row.id,
    offerId: row.offer_id,
    studentId: row.student_id,
    status: row.status,
    coverLetter: row.cover_letter,
    availability: row.availability,
    availableFromDate: row.available_from_date,
    scheduleType: row.schedule_type,
    cvUrl: row.cv_url,
    cvFileName: row.cv_file_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapApplicationDocument(documentSnapshot: any) {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }
}

async function getFirebaseApplicationByOfferAndStudent(offerId: string, studentId: string) {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const applicationsQuery = query(
    collection(db, 'applications'),
    where('offerId', '==', offerId),
    where('studentId', '==', studentId),
  )
  const snapshot = await getDocs(applicationsQuery)
  const [applicationDocument] = snapshot.docs
  return applicationDocument ? mapApplicationDocument(applicationDocument) : null
}

async function createFirebaseApplication(payload: Record<string, any>) {
  const { collection, doc, serverTimestamp, setDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const applicationReference = doc(collection(db, 'applications'))
  const firebasePayload = {
    applicationId: applicationReference.id,
    ...payload,
    createdAt: serverTimestamp(),
  }

  await setDoc(applicationReference, firebasePayload)

  return {
    id: applicationReference.id,
    ...firebasePayload,
  }
}

async function getFirebaseApplicationsByOfferId(offerId: string) {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDocs(
    query(collection(db, 'applications'), where('offerId', '==', offerId)),
  )
  return snapshot.docs.map(mapApplicationDocument)
}

async function getFirebaseApplicationsByStudentId(studentId: string) {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDocs(
    query(collection(db, 'applications'), where('studentId', '==', studentId)),
  )
  return snapshot.docs.map(mapApplicationDocument)
}

async function updateFirebaseApplicationStatus(applicationId: string, status: string) {
  const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    updatedAt: serverTimestamp(),
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

function sortApplicationsByNewest(applications: any[]) {
  return applications.sort(
    (left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt),
  )
}

export async function getApplicationRecordByOfferAndStudent(offerId: string, studentId: string) {
  if (!offerId || !studentId) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return getFirebaseApplicationByOfferAndStudent(offerId, studentId)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('offer_id', offerId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return mapApplicationRow(data)
}

export async function createApplicationRecord(applicationData: Record<string, any>) {
  const existingApplication = await getApplicationRecordByOfferAndStudent(
    applicationData.offerId,
    applicationData.studentId,
  )

  if (existingApplication) {
    return existingApplication
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return createFirebaseApplication(applicationData)
  }

  const now = createTimestamp()
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('applications')
    .insert({
      offer_id: applicationData.offerId,
      student_id: applicationData.studentId,
      status: applicationData.status,
      cover_letter: applicationData.coverLetter,
      availability: applicationData.availability,
      available_from_date: applicationData.availableFromDate,
      schedule_type: applicationData.scheduleType,
      cv_url: applicationData.cvUrl,
      cv_file_name: applicationData.cvFileName,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapApplicationRow(data)
}

export async function getApplicationRecordsByOfferId(offerId: string) {
  if (!offerId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortApplicationsByNewest(await getFirebaseApplicationsByOfferId(offerId))
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapApplicationRow)
}

export async function getApplicationRecordsByStudentId(studentId: string) {
  if (!studentId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortApplicationsByNewest(await getFirebaseApplicationsByStudentId(studentId))
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapApplicationRow)
}

export async function updateApplicationRecordStatus(applicationId: string, status: string) {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return updateFirebaseApplicationStatus(applicationId, status)
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('applications')
    .update({
      status,
      updated_at: createTimestamp(),
    })
    .eq('id', applicationId)

  if (error) {
    throw error
  }
}
