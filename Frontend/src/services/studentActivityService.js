import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { getMockOfferById } from '../data/mockOffers'
import { db } from '../firebase'
import {
  APPLICATION_STATUSES,
  getApplicationStatusLabel,
  normalizeApplicationStatus,
} from './applicationStatus'
import { getOfferById } from './offerService'

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

function createUnavailableOffer(offerId) {
  return {
    id: offerId,
    title: 'Oferta no disponible',
    description: 'La oferta original ya no está disponible en este momento.',
    companyName: 'InternHub',
    company: 'InternHub',
    category: 'General',
    modality: 'Flexible',
    location: 'Ubicación no disponible',
    salary: 'Por definir',
    icon: 'work',
  }
}

async function resolveOffer(offerId) {
  const firestoreOffer = await getOfferById(offerId)

  if (firestoreOffer) {
    return firestoreOffer
  }

  return getMockOfferById(offerId) || createUnavailableOffer(offerId)
}

function enrichApplicationWithOffer(application, offer) {
  return {
    ...application,
    offer,
    offerTitle: offer?.title || 'Oferta no disponible',
    companyName: offer?.companyName || offer?.company || 'InternHub',
    location: offer?.location || 'Ubicación no disponible',
    category: offer?.category || 'General',
    modality: offer?.modality || 'Flexible',
    statusLabel: getApplicationStatusLabel(application.status),
  }
}

export function isOfferSavedByStudent(savedOfferIds, offerId) {
  return Array.isArray(savedOfferIds) && savedOfferIds.includes(offerId)
}

export async function saveOfferForStudent(studentId, offerId) {
  const sanitizedStudentId = studentId?.trim() ?? ''
  const sanitizedOfferId = offerId?.trim() ?? ''

  if (!sanitizedStudentId || !sanitizedOfferId) {
    throw new Error('Se necesita un estudiante y una oferta validos para guardar la oferta.')
  }

  await setDoc(
    doc(db, USERS_COLLECTION, sanitizedStudentId),
    {
      savedOfferIds: arrayUnion(sanitizedOfferId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeSavedOfferForStudent(studentId, offerId) {
  const sanitizedStudentId = studentId?.trim() ?? ''
  const sanitizedOfferId = offerId?.trim() ?? ''

  if (!sanitizedStudentId || !sanitizedOfferId) {
    throw new Error('Se necesita un estudiante y una oferta validos para quitar la oferta.')
  }

  await setDoc(
    doc(db, USERS_COLLECTION, sanitizedStudentId),
    {
      savedOfferIds: arrayRemove(sanitizedOfferId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getStudentApplications(studentId) {
  const sanitizedStudentId = studentId?.trim() ?? ''

  if (!sanitizedStudentId) {
    return []
  }

  const applicationsQuery = query(
    collection(db, APPLICATIONS_COLLECTION),
    where('studentId', '==', sanitizedStudentId),
  )

  const snapshot = await getDocs(applicationsQuery)
  const applications = snapshot.docs
    .map(mapApplicationDocument)
    .sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt))

  if (!applications.length) {
    return []
  }

  const offers = await Promise.all(applications.map((application) => resolveOffer(application.offerId)))

  return applications.map((application, index) =>
    enrichApplicationWithOffer(application, offers[index]),
  )
}

export async function getStudentSavedOffers(savedOfferIds = []) {
  const uniqueOfferIds = Array.from(
    new Set(
      savedOfferIds
        .map((offerId) => (typeof offerId === 'string' ? offerId.trim() : ''))
        .filter(Boolean),
    ),
  ).reverse()

  if (!uniqueOfferIds.length) {
    return []
  }

  const offers = await Promise.all(uniqueOfferIds.map((offerId) => resolveOffer(offerId)))

  return offers.map((offer) => ({
    ...offer,
    savedStatus: APPLICATION_STATUSES.pending,
  }))
}
