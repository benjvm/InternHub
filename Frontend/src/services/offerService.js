import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const OFFERS_COLLECTION = 'offers'

function mapOfferDocument(documentSnapshot) {
  const data = documentSnapshot.data()

  return {
    id: documentSnapshot.id,
    ...data,
    ubicacion: cleanOfferLocation(data.ubicacion),
    responsibilities: cleanResponsibilities(data.responsibilities),
  }
}

function cleanOfferLocation(location) {
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return null
  }

  const latitude = Number(location.latitud)
  const longitude = Number(location.longitud)

  return {
    id: location.id ?? '',
    nombre: location.nombre?.trim() ?? '',
    ciudad: location.ciudad?.trim() ?? '',
    pais: location.pais?.trim() ?? '',
    latitud: Number.isNaN(latitude) ? null : latitude,
    longitud: Number.isNaN(longitude) ? null : longitude,
    tipo: location.tipo ?? '',
  }
}

function cleanResponsibilities(responsibilities) {
  if (!Array.isArray(responsibilities)) {
    return []
  }

  return responsibilities
    .map((responsibility) =>
      typeof responsibility === 'string' ? responsibility.trim() : '',
    )
    .filter(Boolean)
    .slice(0, 5)
}

export async function createOffer(offerData) {
  const offerLocation = cleanOfferLocation(offerData.ubicacion || offerData.locationDetails)
  const responsibilities = cleanResponsibilities(offerData.responsibilities)
  const payload = {
    title: offerData.title?.trim() ?? '',
    category: offerData.category?.trim() ?? '',
    description: offerData.description?.trim() ?? '',
    responsibilities,
    location: offerData.location?.trim() ?? '',
    locationId: offerData.locationId ?? offerLocation?.id ?? '',
    salary: offerData.salary?.trim() ?? '',
    modality: offerData.modality?.trim() ?? '',
    companyId: offerData.companyId ?? '',
    companyName: offerData.companyName?.trim() ?? 'InternHub company',
    icon: offerData.icon ?? 'business_center',
    status: offerData.status ?? 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (offerLocation) {
    payload.ubicacion = offerLocation
  }

  if (!payload.title || !payload.description) {
    throw new Error('Title and description are required.')
  }

  if (!payload.responsibilities.length) {
    throw new Error('Add at least one responsibility for the offer.')
  }

  const documentReference = await addDoc(collection(db, OFFERS_COLLECTION), payload)

  return {
    id: documentReference.id,
    ...payload,
  }
}

export async function getOffers() {
  const snapshot = await getDocs(collection(db, OFFERS_COLLECTION))
  const offers = snapshot.docs.map(mapOfferDocument)

  return offers.sort((left, right) => {
    const leftSeconds = left.createdAt?.seconds ?? 0
    const rightSeconds = right.createdAt?.seconds ?? 0
    return rightSeconds - leftSeconds
  })
}

export async function getOfferById(offerId) {
  if (!offerId) {
    return null
  }

  const snapshot = await getDoc(doc(db, OFFERS_COLLECTION, offerId))

  if (!snapshot.exists()) {
    return null
  }

  return mapOfferDocument(snapshot)
}
