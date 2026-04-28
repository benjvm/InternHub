import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const APPLICATIONS_COLLECTION = 'applications'

function mapApplicationDocument(documentSnapshot) {
  const data = documentSnapshot.data()

  return {
    id: documentSnapshot.id,
    ...data,
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
  const status = applicationData.status?.trim() ?? 'submitted'
  const coverLetter = applicationData.coverLetter?.trim() ?? ''
  const availability = applicationData.availability?.trim() ?? ''
  const availableFromDate = applicationData.availableFromDate?.trim() ?? ''
  const scheduleType = applicationData.scheduleType?.trim() ?? ''
  const cvUrl = applicationData.cvUrl?.trim() ?? ''
  const cvFileName = applicationData.cvFileName?.trim() ?? ''

  if (!offerId || !studentId) {
    throw new Error('Offer ID and student ID are required.')
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
