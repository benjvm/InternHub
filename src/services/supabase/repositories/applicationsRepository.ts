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

export async function getApplicationRecordByOfferAndStudent(offerId: string, studentId: string) {
  if (!offerId || !studentId) {
    return null
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
