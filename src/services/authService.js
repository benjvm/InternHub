import {
  loginAuthUser,
  logoutAuthUser,
  registerAuthUser,
  resetAuthPassword,
} from './supabase/auth/authRepository'

export function registerUser(userData) {
  return registerAuthUser(userData)
}

export function loginUser(credentials) {
  return loginAuthUser(credentials)
}

export function logoutUser() {
  return logoutAuthUser()
}

export function resetPassword(email) {
  return resetAuthPassword(email)
}
