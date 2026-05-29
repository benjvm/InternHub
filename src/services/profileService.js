import {
  deleteUserProfile,
  upsertUserProfile,
} from './supabase/repositories/usersRepository'

export async function updateUserProfile(uid, profileData) {
  if (!uid) {
    throw new Error('No authenticated user was found.')
  }

  return upsertUserProfile(uid, profileData)
}

export async function deleteUserAccount(uid) {
  if (!uid) {
    throw new Error('No se encontro un usuario autenticado.')
  }

  return deleteUserProfile(uid)
}
