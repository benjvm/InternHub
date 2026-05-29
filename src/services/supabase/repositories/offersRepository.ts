import { DATA_BACKENDS, getPreferredDataBackend } from '../../shared/constants/backend'
import { createTimestamp, mapTimestampFields } from '../../shared/helpers/timestamps'
import { getSupabaseClient } from '../client'

function cleanOfferLocation(location: any) {
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

function cleanResponsibilities(responsibilities: any) {
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

function mapOfferRow(row: any) {
  if (!row) {
    return null
  }

  return mapTimestampFields({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    responsibilities: row.responsibilities || [],
    location: row.location,
    locationId: row.location_id,
    salary: row.salary,
    modality: row.modality,
    companyId: row.company_id,
    companyName: row.company_name,
    icon: row.icon,
    status: row.status,
    ubicacion: row.location_details || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapOfferDocument(documentSnapshot: any) {
  const data = documentSnapshot.data()

  return {
    id: documentSnapshot.id,
    ...data,
    ubicacion: cleanOfferLocation(data.ubicacion),
    responsibilities: cleanResponsibilities(data.responsibilities),
  }
}

async function createFirebaseOffer(payload: Record<string, any>) {
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const documentReference = await addDoc(collection(db, 'offers'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: documentReference.id,
    ...payload,
  }
}

async function getFirebaseOffers() {
  const { collection, getDocs } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDocs(collection(db, 'offers'))
  return snapshot.docs.map(mapOfferDocument)
}

async function getFirebaseOfferById(offerId: string) {
  const { doc, getDoc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const snapshot = await getDoc(doc(db, 'offers', offerId))
  return snapshot.exists() ? mapOfferDocument(snapshot) : null
}

async function getFirebaseOffersByCompanyId(companyId: string) {
  const { collection, getDocs, query, where } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  const offersQuery = query(collection(db, 'offers'), where('companyId', '==', companyId))
  const snapshot = await getDocs(offersQuery)
  return snapshot.docs.map(mapOfferDocument)
}

async function deleteFirebaseOffer(offerId: string) {
  const { deleteDoc, doc } = await import('firebase/firestore')
  const { db } = await import('../../../firebase')
  await deleteDoc(doc(db, 'offers', offerId))
}

function sortOffersByNewest(offers: any[]) {
  return offers.sort((left, right) => {
    const leftSeconds = left.createdAt?.seconds ?? 0
    const rightSeconds = right.createdAt?.seconds ?? 0
    return rightSeconds - leftSeconds
  })
}

export async function createOfferRecord(offerData: Record<string, any>) {
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
    companyName: offerData.companyName?.trim() ?? 'Empresa de InternHub',
    icon: offerData.icon ?? 'business_center',
    status: offerData.status ?? 'published',
    ...(offerLocation ? { ubicacion: offerLocation } : {}),
  }

  if (!payload.title || !payload.description) {
    throw new Error('El titulo y la descripcion son obligatorios.')
  }

  if (!payload.responsibilities.length) {
    throw new Error('Anade al menos una responsabilidad para la oferta.')
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return createFirebaseOffer(payload)
  }

  const now = createTimestamp()
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('offers')
    .insert({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      responsibilities: payload.responsibilities,
      location: payload.location,
      location_id: payload.locationId,
      salary: payload.salary,
      modality: payload.modality,
      company_id: payload.companyId,
      company_name: payload.companyName,
      icon: payload.icon,
      status: payload.status,
      location_details: payload.ubicacion || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapOfferRow(data)
}

export async function getOfferRecords() {
  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortOffersByNewest(await getFirebaseOffers())
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapOfferRow)
}

export async function getOfferRecordById(offerId: string) {
  if (!offerId) {
    return null
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return getFirebaseOfferById(offerId)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('offers').select('*').eq('id', offerId).maybeSingle()

  if (error) {
    throw error
  }

  return mapOfferRow(data)
}

export async function getOfferRecordsByCompanyId(companyId: string) {
  const sanitizedCompanyId = companyId?.trim() ?? ''

  if (!sanitizedCompanyId) {
    return []
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return sortOffersByNewest(await getFirebaseOffersByCompanyId(sanitizedCompanyId))
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('company_id', sanitizedCompanyId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []).map(mapOfferRow)
}

export async function deleteOfferRecord(offerId: string) {
  const sanitizedOfferId = offerId?.trim() ?? ''

  if (!sanitizedOfferId) {
    throw new Error('Se necesita una oferta valida para eliminarla.')
  }

  if (getPreferredDataBackend() === DATA_BACKENDS.firebase) {
    return deleteFirebaseOffer(sanitizedOfferId)
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from('offers').delete().eq('id', sanitizedOfferId)

  if (error) {
    throw error
  }
}
