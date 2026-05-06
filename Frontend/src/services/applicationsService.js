import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  APPLICATION_STATUSES,
  getApplicationStatusLabel,
  normalizeApplicationStatus,
} from './applicationStatus'
import { createInternshipFromApplication } from './internshipService'
import { getOffersByCompanyId } from './offerService'

const APPLICATIONS_COLLECTION = 'applications'
const USERS_COLLECTION = 'users'

function mapApplicationDocument(documentSnapshot) {
  const data = documentSnapshot.data()

  return {
    id: documentSnapshot.id,
    ...data,
    status: normalizeApplicationStatus(data.status),
  }
}

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

function mapStudentProfile(snapshot) {
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    displayName: getStudentDisplayName(data),
    university: data.universidad || data.university || 'Universidad no indicada',
    degree: data.carrera || data.degree || '',
    email: data.correo || data.email || '',
    cvUrl: data.cvUrl || data.resumeUrl || data.curriculumUrl || '',
    cvFileName: data.cvFileName || '',
  }
}

export async function getApplicationByOfferAndStudent(offerId, studentId) {
  if (!offerId || !studentId) {
    return null
  }

  const applicationsQuery = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('offerId', '==', offerId),
    where('studentId', '==', studentId),
  )

  const snapshot = await getDocs(applicationsQuery)
  const [applicationDocument] = snapshot.docs

  if (!applicationDocument) {
    return null
  }

  return mapApplicationDocument(applicationDocument)
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

  const existingApplication = await getApplicationByOfferAndStudent(offerId, studentId)

  if (existingApplication) {
    return existingApplication
  }

  const applicationReference = doc(collection(db, APPLICATIONS_COLLECTION))
  const payload = {
    applicationId: applicationReference.id,
    offerId,
    studentId,
    status,
    coverLetter,
    availability,
    availableFromDate,
    scheduleType,
    cvUrl,
    cvFileName,
    createdAt: serverTimestamp(),
  }

  await setDoc(applicationReference, payload)

  return {
    id: applicationReference.id,
    ...payload,
  }
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
  const applicationSnapshots = await Promise.all(
    offers.map((offer) =>
      getDocs(
        query(collection(db, APPLICATIONS_COLLECTION), where('offerId', '==', offer.id)),
      ),
    ),
  )

  const applications = applicationSnapshots
    .flatMap((snapshot) => snapshot.docs.map(mapApplicationDocument))
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  if (!applications.length) {
    return []
  }

  const uniqueStudentIds = Array.from(
    new Set(applications.map((application) => application.studentId).filter(Boolean)),
  )

  const studentSnapshots = await Promise.all(
    uniqueStudentIds.map((studentId) => getDoc(doc(db, USERS_COLLECTION, studentId))),
  )

  const studentMap = new Map(
    studentSnapshots
      .map((snapshot) => [snapshot.id, mapStudentProfile(snapshot)])
      .filter(([, student]) => Boolean(student)),
  )

  return applications.map((application) => {
    const offer = offerMap.get(application.offerId) || null
    const student = studentMap.get(application.studentId) || null

    return {
      ...application,
      offer,
      offerTitle: offer?.title || 'Oferta sin título',
      companyName: offer?.companyName || 'Empresa',
      location: offer?.location || 'Ubicación no indicada',
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
    throw new Error('Se necesita una candidatura válida para actualizar su estado.')
  }

  await updateDoc(doc(db, APPLICATIONS_COLLECTION, sanitizedApplicationId), {
    status: normalizedStatus,
    updatedAt: serverTimestamp(),
  })

  return normalizedStatus
}

export async function acceptApplication(applicationData) {
  const applicationId = applicationData?.id?.trim() ?? ''
  const previousStatus = normalizeApplicationStatus(applicationData?.status)

  if (!applicationId) {
    throw new Error('Se necesita una candidatura válida para aceptar al candidato.')
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
        // Si la reversión falla, dejamos que el error principal siga su curso.
      }
    }

    throw error
  }
}
