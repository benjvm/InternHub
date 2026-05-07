import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const INTERNSHIPS_COLLECTION = 'internships'
const OFFERS_COLLECTION = 'offers'
const USERS_COLLECTION = 'users'

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

function mapInternshipDocument(documentSnapshot) {
  const data = documentSnapshot.data()
  const requiredHours = data.requiredHours ?? data.totalHours ?? data.weeklyHours ?? null

  return {
    id: documentSnapshot.id,
    ...data,
    requiredHours,
    totalHours: data.totalHours ?? requiredHours,
    completedHours: Number(data.completedHours || 0),
    status: normalizeInternshipStatus(data.status),
  }
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
    email: data.correo || data.email || '',
  }
}

function mapOffer(snapshot) {
  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

function getCompanyDisplayName(company) {
  return company?.nombreEmpresa || company?.companyName || 'Empresa'
}

function mapCompanyProfile(snapshot) {
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    id: snapshot.id,
    ...data,
    displayName: getCompanyDisplayName(data),
    email: data.email || data.correo || '',
  }
}

function normalizeDateValue(value, fieldName) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    throw new Error(`El campo ${fieldName} es obligatorio.`)
  }

  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`El campo ${fieldName} no tiene una fecha válida.`)
  }

  return normalizedValue
}

function normalizeTotalHours(value) {
  if (value === null || value === undefined || value === '') {
    throw new Error('Las horas totales son obligatorias.')
  }

  const normalizedValue = Number(value)

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    throw new Error('Las horas totales deben ser un número mayor que cero.')
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

  const [studentSnapshots, offerSnapshots, companySnapshots] = await Promise.all([
    Promise.all(uniqueStudentIds.map((studentId) => getDoc(doc(db, USERS_COLLECTION, studentId)))),
    Promise.all(uniqueOfferIds.map((offerId) => getDoc(doc(db, OFFERS_COLLECTION, offerId)))),
    Promise.all(uniqueCompanyIds.map((companyId) => getDoc(doc(db, USERS_COLLECTION, companyId)))),
  ])

  const studentMap = new Map(
    studentSnapshots
      .map((snapshot) => [snapshot.id, mapStudentProfile(snapshot)])
      .filter(([, student]) => Boolean(student)),
  )

  const offerMap = new Map(
    offerSnapshots
      .map((snapshot) => [snapshot.id, mapOffer(snapshot)])
      .filter(([, offer]) => Boolean(offer)),
  )

  const companyMap = new Map(
    companySnapshots
      .map((snapshot) => [snapshot.id, mapCompanyProfile(snapshot)])
      .filter(([, company]) => Boolean(company)),
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
      offerTitle: offer?.title || 'Oferta sin título',
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

  if (!sanitizedApplicationId) {
    return null
  }

  const internshipsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION),
    where('applicationId', '==', sanitizedApplicationId),
  )

  const snapshot = await getDocs(internshipsQuery)
  const [internshipDocument] = snapshot.docs

  return internshipDocument ? mapInternshipDocument(internshipDocument) : null
}

export async function getInternshipByOfferAndStudent(offerId, studentId) {
  const sanitizedOfferId = normalizeText(offerId)
  const sanitizedStudentId = normalizeText(studentId)

  if (!sanitizedOfferId || !sanitizedStudentId) {
    return null
  }

  const internshipsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION),
    where('offerId', '==', sanitizedOfferId),
    where('studentId', '==', sanitizedStudentId),
  )

  const snapshot = await getDocs(internshipsQuery)
  const [internshipDocument] = snapshot.docs

  return internshipDocument ? mapInternshipDocument(internshipDocument) : null
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
    throw new Error('Se necesita una candidatura válida para crear la práctica.')
  }

  if (!studentId || !offerId || !companyId) {
    throw new Error('La candidatura aceptada no tiene los datos mínimos para crear la práctica.')
  }

  const existingInternship = await internshipExistsForApplication({
    applicationId,
    offerId,
    studentId,
  })

  if (existingInternship) {
    return existingInternship
  }

  const internshipReference = doc(collection(db, INTERNSHIPS_COLLECTION))
  const payload = {
    id: internshipReference.id,
    applicationId,
    studentId,
    companyId,
    offerId,
    professorId,
    status: INTERNSHIP_STATUSES.pending,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    startDate: null,
    endDate: null,
    requiredHours: null,
    totalHours: null,
    tutorCompanyName: '',
    notes: '',
    lastUpdate: null,
  }

  await setDoc(internshipReference, payload)

  return {
    id: internshipReference.id,
    ...payload,
  }
}

export async function getInternshipsByCompanyId(companyId) {
  const sanitizedCompanyId = normalizeText(companyId)

  if (!sanitizedCompanyId) {
    return []
  }

  const internshipsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION),
    where('companyId', '==', sanitizedCompanyId),
  )

  const snapshot = await getDocs(internshipsQuery)
  const internships = snapshot.docs
    .map(mapInternshipDocument)
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  return enrichInternships(internships)
}

export async function getInternshipsByStudentId(studentId) {
  const sanitizedStudentId = normalizeText(studentId)

  if (!sanitizedStudentId) {
    return []
  }

  const internshipsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION),
    where('studentId', '==', sanitizedStudentId),
  )

  const snapshot = await getDocs(internshipsQuery)
  const internships = snapshot.docs
    .map(mapInternshipDocument)
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  const enrichedInternships = await enrichInternships(internships)

  return enrichedInternships.map((internship) => ({
    ...internship,
    companyName:
      internship.companyName || internship.offer?.companyName || internship.offer?.company || '',
  }))
}

export async function getInternshipsByProfessorId(professorId) {
  const sanitizedProfessorId = normalizeText(professorId)

  if (!sanitizedProfessorId) {
    return []
  }

  const internshipsQuery = query(
    collection(db, INTERNSHIPS_COLLECTION),
    where('professorId', '==', sanitizedProfessorId),
  )

  const snapshot = await getDocs(internshipsQuery)
  const internships = snapshot.docs
    .map(mapInternshipDocument)
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  return enrichInternships(internships)
}

export async function getInternshipsWithoutProfessor() {
  const snapshot = await getDocs(collection(db, INTERNSHIPS_COLLECTION))
  const internships = snapshot.docs
    .map(mapInternshipDocument)
    .filter((internship) => !normalizeText(internship.professorId))
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  return enrichInternships(internships)
}

export async function getInternshipById(internshipId) {
  const sanitizedInternshipId = normalizeText(internshipId)

  if (!sanitizedInternshipId) {
    return null
  }

  const snapshot = await getDoc(doc(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId))

  if (!snapshot.exists()) {
    return null
  }

  const [internship] = await enrichInternships([mapInternshipDocument(snapshot)])
  return internship || null
}

export async function updateInternshipDetails(internshipId, data) {
  const sanitizedInternshipId = normalizeText(internshipId)

  if (!sanitizedInternshipId) {
    throw new Error('Se necesita una práctica válida para actualizar sus datos.')
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
    throw new Error('Las notas de la práctica son obligatorias.')
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
    lastUpdate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await updateDoc(doc(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId), payload)

  return {
    id: sanitizedInternshipId,
    ...payload,
  }
}

export async function updateInternshipStatus(internshipId, status) {
  const sanitizedInternshipId = normalizeText(internshipId)
  const normalizedStatus = normalizeInternshipStatus(status)

  if (!sanitizedInternshipId) {
    throw new Error('Se necesita una práctica válida para actualizar su estado.')
  }

  await updateDoc(doc(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId), {
    status: normalizedStatus,
    updatedAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
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

  const internshipRef = doc(db, INTERNSHIPS_COLLECTION, sanitizedInternshipId)

  await runTransaction(db, async (transaction) => {
    const internshipSnapshot = await transaction.get(internshipRef)

    if (!internshipSnapshot.exists()) {
      throw new Error('La practica seleccionada ya no esta disponible.')
    }

    const internshipData = internshipSnapshot.data()
    const currentProfessorId = normalizeText(internshipData.professorId)

    if (currentProfessorId && currentProfessorId !== sanitizedProfessorId) {
      throw new Error('Esta practica ya tiene otro profesor responsable asignado.')
    }

    transaction.update(internshipRef, {
      professorId: sanitizedProfessorId,
      updatedAt: serverTimestamp(),
      lastUpdate: serverTimestamp(),
    })
  })

  return getInternshipById(sanitizedInternshipId)
}
