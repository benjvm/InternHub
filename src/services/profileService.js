import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const USERS_COLLECTION = 'users'

export async function updateUserProfile(uid, profileData) {
  if (!uid) {
    throw new Error('No authenticated user was found.')
  }

  const sanitizedProfile = Object.entries(profileData).reduce((accumulator, [key, value]) => {
    if (value === undefined) {
      return accumulator
    }

    accumulator[key] = typeof value === 'string' ? value.trim() : value
    return accumulator
  }, {})

  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      ...sanitizedProfile,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return sanitizedProfile
}

export async function deleteUserAccount(uid) {
  if (!uid) {
    throw new Error('No se encontró un usuario autenticado.')
  }

  await deleteDoc(doc(db, USERS_COLLECTION, uid))
}
