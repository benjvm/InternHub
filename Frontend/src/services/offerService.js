import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const OFFERS_COLLECTION = 'offers'

function mapOfferDocument(documentSnapshot) {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }
}

export async function createOffer(offerData) {
  const payload = {
    title: offerData.title?.trim() ?? '',
    category: offerData.category?.trim() ?? '',
    description: offerData.description?.trim() ?? '',
    location: offerData.location?.trim() ?? '',
    salary: offerData.salary?.trim() ?? '',
    modality: offerData.modality?.trim() ?? '',
    companyId: offerData.companyId ?? '',
    companyName: offerData.companyName?.trim() ?? 'InternHub company',
    icon: offerData.icon ?? 'business_center',
    status: offerData.status ?? 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (!payload.title || !payload.description) {
    throw new Error('Title and description are required.')
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
