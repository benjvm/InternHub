import { getMockOfferById } from '../data/mockOffers'
import {
  APPLICATION_STATUSES,
  getApplicationStatusLabel,
  normalizeApplicationStatus,
} from './applicationStatus'
import { getApplicationRecordsByStudentId } from './supabase/repositories/applicationsRepository'
import {
  addSavedOffer,
  removeSavedOffer,
} from './supabase/repositories/usersRepository'
import { getOfferById } from './offerService'

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
    description: 'La oferta original ya no esta disponible en este momento.',
    companyName: 'InternHub',
    company: 'InternHub',
    category: 'General',
    modality: 'Flexible',
    location: 'Ubicacion no disponible',
    salary: 'Por definir',
    icon: 'work',
  }
}

async function resolveOffer(offerId) {
  const persistedOffer = await getOfferById(offerId)

  if (persistedOffer) {
    return persistedOffer
  }

  return getMockOfferById(offerId) || createUnavailableOffer(offerId)
}

function enrichApplicationWithOffer(application, offer) {
  return {
    ...application,
    status: normalizeApplicationStatus(application.status),
    offer,
    offerTitle: offer?.title || 'Oferta no disponible',
    companyName: offer?.companyName || offer?.company || 'InternHub',
    location: offer?.location || 'Ubicacion no disponible',
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

  await addSavedOffer(sanitizedStudentId, sanitizedOfferId)
}

export async function removeSavedOfferForStudent(studentId, offerId) {
  const sanitizedStudentId = studentId?.trim() ?? ''
  const sanitizedOfferId = offerId?.trim() ?? ''

  if (!sanitizedStudentId || !sanitizedOfferId) {
    throw new Error('Se necesita un estudiante y una oferta validos para quitar la oferta.')
  }

  await removeSavedOffer(sanitizedStudentId, sanitizedOfferId)
}

export async function getStudentApplications(studentId) {
  const sanitizedStudentId = studentId?.trim() ?? ''

  if (!sanitizedStudentId) {
    return []
  }

  const applications = (await getApplicationRecordsByStudentId(sanitizedStudentId))
    .map((application) => ({
      ...application,
      status: normalizeApplicationStatus(application.status),
    }))
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
