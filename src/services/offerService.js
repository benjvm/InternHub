import {
  createOfferRecord,
  deleteOfferRecord,
  getOfferRecordById,
  getOfferRecords,
  getOfferRecordsByCompanyId,
} from './supabase/repositories/offersRepository'

export function createOffer(offerData) {
  return createOfferRecord(offerData)
}

export function getOffers() {
  return getOfferRecords()
}

export function getOfferById(offerId) {
  return getOfferRecordById(offerId)
}

export function getOffersByCompanyId(companyId) {
  return getOfferRecordsByCompanyId(companyId)
}

export function deleteOffer(offerId) {
  return deleteOfferRecord(offerId)
}
