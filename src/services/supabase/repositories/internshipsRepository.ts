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

  const [internship] = await getSupabaseInternshipsByColumn('application_id', applicationId)
  return internship || null
}

export async function getInternshipRecordByOfferAndStudent(offerId: string, studentId: string) {
  if (!offerId || !studentId) {
    return null
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

  return getSupabaseInternshipsByColumn('company_id', companyId)
}

export async function getInternshipRecordsByStudentId(studentId: string) {
  if (!studentId) {
    return []
  }

  return getSupabaseInternshipsByColumn('student_id', studentId)
}

export async function getInternshipRecordsByProfessorId(professorId: string) {
  if (!professorId) {
    return []
  }

  return getSupabaseInternshipsByColumn('professor_id', professorId)
}

export async function getInternshipRecordsWithoutProfessor() {
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
