import {
  assignProfessorRecord,
  createInternshipRecord,
  getInternshipRecordByApplicationId,
  getInternshipRecordById,
  getInternshipRecordByOfferAndStudent,
  getInternshipRecordsByCompanyId,
  getInternshipRecordsByProfessorId,
  getInternshipRecordsByStudentId,
  getInternshipRecordsWithoutProfessor,
  updateInternshipRecord,
} from './supabase/repositories/internshipsRepository'
import { getOfferById } from './offerService'
import { getUserById } from './supabase/repositories/usersRepository'

export const INTERNSHIP_STATUSES = {
  pending: 'pendiente',
  active: 'activo',
  completed: 'completado',
  cancelled: 'cancelado',
}

export const INTERNSHIP_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: INTERNSHIP_STATUSES.pending, label: 'Pendientes' },
  { id: INTERNSHIP_STATUSES.active, label: 'Activas' },
  { id: INTERNSHIP_STATUSES.completed, label: 'Completadas' },
  { id: INTERNSHIP_STATUSES.cancelled, label: 'Canceladas' },
]

const LEGACY_INTERNSHIP_STATUS_MAP = {
  pending: INTERNSHIP_STATUSES.pending,
  pendiente: INTERNSHIP_STATUSES.pending,
  active: INTERNSHIP_STATUSES.active,
  activo: INTERNSHIP_STATUSES.active,
  completed: INTERNSHIP_STATUSES.completed,
  completado: INTERNSHIP_STATUSES.completed,
  canceled: INTERNSHIP_STATUSES.cancelled,
  cancelled: INTERNSHIP_STATUSES.cancelled,
  cancelado: INTERNSHIP_STATUSES.cancelled,
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function getStudentDisplayName(student) {
  const fullName = [student?.nombre, student?.apellido].filter(Boolean).join(' ').trim()

  if (fullName) {
    return fullName
  }

  return student?.correo || student?.email || 'Estudiante'
}

function mapStudentProfile(student) {
  if (!student) {
    return null
  }

  return {
    ...student,
    displayName: getStudentDisplayName(student),
    email: student.correo || student.email || '',
  }
}

function getCompanyDisplayName(company) {
  return company?.nombreEmpresa || company?.companyName || 'Empresa'
}

function mapCompanyProfile(company) {
  if (!company) {
    return null
  }

  return {
    ...company,
    displayName: getCompanyDisplayName(company),
    email: company.email || company.correo || '',
  }
}

function normalizeDateValue(value, fieldName) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    throw new Error(`El campo ${fieldName} es obligatorio.`)
  }

  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`El campo ${fieldName} no tiene una fecha valida.`)
  }

  return normalizedValue
}

function normalizeTotalHours(value) {
  if (value === null || value === undefined || value === '') {
    throw new Error('Las horas totales son obligatorias.')
  }

  const normalizedValue = Number(value)

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    throw new Error('Las horas totales deben ser un numero mayor que cero.')
  }

  return normalizedValue
}

async function enrichInternships(internships) {
  if (!internships.length) {
    return []
  }

  const uniqueStudentIds = Array.from(
    new Set(internships.map((item) => item.studentId).filter(Boolean)),
  )
  const uniqueOfferIds = Array.from(
    new Set(internships.map((item) => item.offerId).filter(Boolean)),
  )
  const uniqueCompanyIds = Array.from(
    new Set(internships.map((item) => item.companyId).filter(Boolean)),
  )

  const [students, offers, companies] = await Promise.all([
    Promise.all(uniqueStudentIds.map((studentId) => getUserById(studentId))),
    Promise.all(uniqueOfferIds.map((offerId) => getOfferById(offerId))),
    Promise.all(uniqueCompanyIds.map((companyId) => getUserById(companyId))),
  ])

  const studentMap = new Map(
    students
      .map((student) => [student?.id || student?.uid, mapStudentProfile(student)])
      .filter(([studentId, student]) => Boolean(studentId && student)),
  )

  const offerMap = new Map(
    offers
      .map((offer) => [offer?.id, offer])
      .filter(([offerId, offer]) => Boolean(offerId && offer)),
  )

  const companyMap = new Map(
    companies
      .map((company) => [company?.id || company?.uid, mapCompanyProfile(company)])
      .filter(([companyId, company]) => Boolean(companyId && company)),
  )

  return internships.map((internship) => {
    const student = studentMap.get(internship.studentId) || null
    const offer = offerMap.get(internship.offerId) || null
    const company = companyMap.get(internship.companyId) || null

    return {
      ...internship,
      student,
      offer,
      company,
      studentName: student?.displayName || 'Estudiante',
      studentEmail: student?.email || '',
      offerTitle: offer?.title || 'Oferta sin titulo',
      companyName: offer?.companyName || offer?.company || company?.displayName || 'Empresa',
      statusLabel: getInternshipStatusLabel(internship.status),
    }
  })
}

export function normalizeInternshipStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase()
  return LEGACY_INTERNSHIP_STATUS_MAP[normalizedStatus] || INTERNSHIP_STATUSES.pending
}

export function matchesInternshipFilter(status, filterId) {
  if (!filterId || filterId === 'all') {
    return true
  }

  return normalizeInternshipStatus(status) === filterId
}

export function getInternshipStatusLabel(status) {
  switch (normalizeInternshipStatus(status)) {
    case INTERNSHIP_STATUSES.active:
      return 'Activa'
    case INTERNSHIP_STATUSES.completed:
      return 'Completada'
    case INTERNSHIP_STATUSES.cancelled:
      return 'Cancelada'
    case INTERNSHIP_STATUSES.pending:
    default:
      return 'Pendiente'
  }
}

export async function getInternshipByApplicationId(applicationId) {
  const sanitizedApplicationId = normalizeText(applicationId)
  const internship = await getInternshipRecordByApplicationId(sanitizedApplicationId)
  return internship ? { ...internship, status: normalizeInternshipStatus(internship.status) } : null
}

export async function getInternshipByOfferAndStudent(offerId, studentId) {
  const sanitizedOfferId = normalizeText(offerId)
  const sanitizedStudentId = normalizeText(studentId)
  const internship = await getInternshipRecordByOfferAndStudent(sanitizedOfferId, sanitizedStudentId)
  return internship ? { ...internship, status: normalizeInternshipStatus(internship.status) } : null
}

export async function internshipExistsForApplication(applicationData) {
  const applicationId = normalizeText(applicationData?.id || applicationData?.applicationId)
  const offerId = normalizeText(applicationData?.offerId)
  const studentId = normalizeText(applicationData?.studentId)

  const internshipByApplication = await getInternshipByApplicationId(applicationId)

  if (internshipByApplication) {
    return internshipByApplication
  }

  return getInternshipByOfferAndStudent(offerId, studentId)
}

export async function createInternshipFromApplication(applicationData) {
  const applicationId = normalizeText(applicationData?.id || applicationData?.applicationId)
  const studentId = normalizeText(applicationData?.studentId)
  const offerId = normalizeText(applicationData?.offerId)
  const companyId = normalizeText(applicationData?.companyId || applicationData?.offer?.companyId)
  const professorId = applicationData?.professorId ?? null

  if (!applicationId) {
    throw new Error('Se necesita una candidatura valida para crear la practica.')
  }

  if (!studentId || !offerId || !companyId) {
    throw new Error('La candidatura aceptada no tiene los datos minimos para crear la practica.')
  }

  const existingInternship = await internshipExistsForApplication({
    applicationId,
    offerId,
    studentId,
  })

  if (existingInternship) {
    return existingInternship
  }

  return createInternshipRecord({
    applicationId,
    studentId,
    companyId,
    offerId,
    professorId,
    status: INTERNSHIP_STATUSES.pending,
    startDate: null,
    endDate: null,
    requiredHours: null,
    totalHours: null,
    completedHours: 0,
    tutorCompanyName: '',
    notes: '',
    lastUpdate: null,
  })
}

export async function getInternshipsByCompanyId(companyId) {
  const internships = await getInternshipRecordsByCompanyId(normalizeText(companyId))
  return enrichInternships(internships.map((item) => ({
    ...item,
    status: normalizeInternshipStatus(item.status),
  })))
}

export async function getInternshipsByStudentId(studentId) {
  const internships = await getInternshipRecordsByStudentId(normalizeText(studentId))
  const enrichedInternships = await enrichInternships(
    internships.map((item) => ({ ...item, status: normalizeInternshipStatus(item.status) })),
  )

  return enrichedInternships.map((internship) => ({
    ...internship,
    companyName:
      internship.companyName || internship.offer?.companyName || internship.offer?.company || '',
  }))
}

export async function getInternshipsByProfessorId(professorId) {
  const internships = await getInternshipRecordsByProfessorId(normalizeText(professorId))
  return enrichInternships(internships.map((item) => ({
    ...item,
    status: normalizeInternshipStatus(item.status),
  })))
}

export async function getInternshipsWithoutProfessor() {
  const internships = await getInternshipRecordsWithoutProfessor()
  return enrichInternships(internships.map((item) => ({
    ...item,
    status: normalizeInternshipStatus(item.status),
  })))
}

export async function getInternshipById(internshipId) {
  const internship = await getInternshipRecordById(normalizeText(internshipId))

  if (!internship) {
    return null
  }

  const [enrichedInternship] = await enrichInternships([
    { ...internship, status: normalizeInternshipStatus(internship.status) },
  ])
  return enrichedInternship || null
}

export async function updateInternshipDetails(internshipId, data) {
  const sanitizedInternshipId = normalizeText(internshipId)

  if (!sanitizedInternshipId) {
    throw new Error('Se necesita una practica valida para actualizar sus datos.')
  }

  const startDate = normalizeDateValue(data?.startDate, 'fecha de inicio')
  const endDate = normalizeDateValue(data?.endDate, 'fecha de fin')
  const totalHours = normalizeTotalHours(data?.totalHours ?? data?.weeklyHours)
  const tutorCompanyName = normalizeText(data?.tutorCompanyName)
  const notes = normalizeText(data?.notes)

  if (!tutorCompanyName) {
    throw new Error('El nombre del tutor de empresa es obligatorio.')
  }

  if (!notes) {
    throw new Error('Las notas de la practica son obligatorias.')
  }

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin.')
  }

  const payload = {
    startDate,
    endDate,
    totalHours,
    requiredHours: totalHours,
    tutorCompanyName,
    notes,
    status: INTERNSHIP_STATUSES.active,
  }

  await updateInternshipRecord(sanitizedInternshipId, payload)

  return {
    id: sanitizedInternshipId,
    ...payload,
  }
}

export async function updateInternshipStatus(internshipId, status) {
  const sanitizedInternshipId = normalizeText(internshipId)
  const normalizedStatus = normalizeInternshipStatus(status)

  if (!sanitizedInternshipId) {
    throw new Error('Se necesita una practica valida para actualizar su estado.')
  }

  await updateInternshipRecord(sanitizedInternshipId, {
    status: normalizedStatus,
  })

  return normalizedStatus
}

export async function assignProfessorToInternship(internshipId, professorId) {
  const sanitizedInternshipId = normalizeText(internshipId)
  const sanitizedProfessorId = normalizeText(professorId)

  if (!sanitizedInternshipId) {
    throw new Error('Se necesita una practica valida para asignar el seguimiento.')
  }

  if (!sanitizedProfessorId) {
    throw new Error('No se ha encontrado el profesor responsable.')
  }

  await assignProfessorRecord(sanitizedInternshipId, sanitizedProfessorId)
  return getInternshipById(sanitizedInternshipId)
}
