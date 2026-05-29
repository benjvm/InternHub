import {
  createApplicationRecord,
  getApplicationRecordByOfferAndStudent,
  getApplicationRecordsByOfferId,
  updateApplicationRecordStatus,
} from './supabase/repositories/applicationsRepository'
import { getUserById } from './supabase/repositories/usersRepository'
import {
  APPLICATION_STATUSES,
  getApplicationStatusLabel,
  normalizeApplicationStatus,
} from './applicationStatus'
import { createInternshipFromApplication } from './internshipService'
import { getOffersByCompanyId } from './offerService'

function getTimestampValue(timestamp) {
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000
  }

  if (typeof timestamp === 'string' || timestamp instanceof Date) {
    const dateValue = new Date(timestamp).getTime()
    return Number.isNaN(dateValue) ? 0 : dateValue
  }

  return 0
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
    university: student.universidad || student.university || 'Universidad no indicada',
    degree: student.carrera || student.degree || '',
    email: student.correo || student.email || '',
    cvUrl: student.cvUrl || student.resumeUrl || student.curriculumUrl || '',
    cvFileName: student.cvFileName || '',
  }
}

function mapApplication(application) {
  return {
    ...application,
    status: normalizeApplicationStatus(application.status),
  }
}

export async function getApplicationByOfferAndStudent(offerId, studentId) {
  const application = await getApplicationRecordByOfferAndStudent(offerId, studentId)
  return application ? mapApplication(application) : null
}

export async function createApplication(applicationData) {
  const offerId = applicationData.offerId?.trim() ?? ''
  const studentId = applicationData.studentId?.trim() ?? ''
  const status = normalizeApplicationStatus(applicationData.status ?? APPLICATION_STATUSES.pending)
  const coverLetter = applicationData.coverLetter?.trim() ?? ''
  const availability = applicationData.availability?.trim() ?? ''
  const availableFromDate = applicationData.availableFromDate?.trim() ?? ''
  const scheduleType = applicationData.scheduleType?.trim() ?? ''
  const cvUrl = applicationData.cvUrl?.trim() ?? ''
  const cvFileName = applicationData.cvFileName?.trim() ?? ''

  if (!offerId || !studentId) {
    throw new Error('El identificador de la oferta y del estudiante son obligatorios.')
  }

  const application = await createApplicationRecord({
    offerId,
    studentId,
    status,
    coverLetter,
    availability,
    availableFromDate,
    scheduleType,
    cvUrl,
    cvFileName,
  })

  return mapApplication(application)
}

export async function getCompanyApplications(companyId) {
  const sanitizedCompanyId = companyId?.trim() ?? ''

  if (!sanitizedCompanyId) {
    return []
  }

  const offers = await getOffersByCompanyId(sanitizedCompanyId)

  if (!offers.length) {
    return []
  }

  const offerMap = new Map(offers.map((offer) => [offer.id, offer]))
  const applicationGroups = await Promise.all(
    offers.map((offer) => getApplicationRecordsByOfferId(offer.id)),
  )

  const applications = applicationGroups
    .flatMap((group) => group.map(mapApplication))
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  if (!applications.length) {
    return []
  }

  const uniqueStudentIds = Array.from(
    new Set(applications.map((application) => application.studentId).filter(Boolean)),
  )

  const students = await Promise.all(uniqueStudentIds.map((studentId) => getUserById(studentId)))
  const studentMap = new Map(
    students
      .map((student) => [student?.id || student?.uid, mapStudentProfile(student)])
      .filter(([studentId, student]) => Boolean(studentId && student)),
  )

  return applications.map((application) => {
    const offer = offerMap.get(application.offerId) || null
    const student = studentMap.get(application.studentId) || null

    return {
      ...application,
      offer,
      offerTitle: offer?.title || 'Oferta sin titulo',
      companyName: offer?.companyName || 'Empresa',
      location: offer?.location || 'Ubicacion no indicada',
      student,
      studentName: student?.displayName || 'Estudiante',
      studentUniversity: student?.university || 'Universidad no indicada',
      studentDegree: student?.degree || '',
      studentEmail: student?.email || '',
      statusLabel: getApplicationStatusLabel(application.status),
    }
  })
}

export async function updateApplicationStatus(applicationId, nextStatus) {
  const sanitizedApplicationId = applicationId?.trim() ?? ''
  const normalizedStatus = normalizeApplicationStatus(nextStatus)

  if (!sanitizedApplicationId) {
    throw new Error('Se necesita una candidatura valida para actualizar su estado.')
  }

  await updateApplicationRecordStatus(sanitizedApplicationId, normalizedStatus)
  return normalizedStatus
}

export async function acceptApplication(applicationData) {
  const applicationId = applicationData?.id?.trim() ?? ''
  const previousStatus = normalizeApplicationStatus(applicationData?.status)

  if (!applicationId) {
    throw new Error('Se necesita una candidatura valida para aceptar al candidato.')
  }

  const normalizedStatus = await updateApplicationStatus(
    applicationId,
    APPLICATION_STATUSES.accepted,
  )

  try {
    const internship = await createInternshipFromApplication(applicationData)

    return {
      status: normalizedStatus,
      internship,
    }
  } catch (error) {
    if (previousStatus !== APPLICATION_STATUSES.accepted) {
      try {
        await updateApplicationStatus(applicationId, previousStatus)
      } catch {
        // Si la reversion falla, dejamos que el error principal siga su curso.
      }
    }

    throw error
  }
}
