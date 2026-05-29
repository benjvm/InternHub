/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentAuthUser, onAuthUserChanged } from './supabase/auth/authRepository'
import { getUserById } from './supabase/repositories/usersRepository'

const UserContext = createContext({
  firebaseUser: null,
  authUser: null,
  userProfile: null,
  currentUser: null,
  loadingUser: true,
  userError: null,
  refreshUserProfile: async () => null,
  clearUserState: () => {},
})

async function resolveProfileUid(uid) {
  if (uid) {
    return uid
  }

  const authUser = await getCurrentAuthUser()
  return authUser?.uid || null
}

export async function fetchUserProfile(uid) {
  const profileUid = await resolveProfileUid(uid)

  if (!profileUid) {
    return null
  }

  return getUserById(profileUid)
}

export function UserProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userError, setUserError] = useState(null)

  const clearUserState = () => {
    setAuthUser(null)
    setUserProfile(null)
    setUserError(null)
  }

  const refreshUserProfile = async (uid) => {
    const profileUid = await resolveProfileUid(uid || authUser?.uid)

    if (!profileUid) {
      setUserProfile(null)
      return null
    }

    try {
      setUserError(null)
      const profile = await fetchUserProfile(profileUid)
      setUserProfile(profile)
      return profile
    } catch (error) {
      setUserError(error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (user) => {
      setLoadingUser(true)

      if (!user) {
        clearUserState()
        setLoadingUser(false)
        return
      }

      if (user.isAnonymous) {
        setAuthUser(user)
        setUserProfile(null)
        setUserError(null)
        setLoadingUser(false)
        return
      }

      try {
        setAuthUser(user)
        setUserError(null)
        const profile = await fetchUserProfile(user.uid)
        setUserProfile(profile)
      } catch (error) {
        setUserError(error)
        setUserProfile(null)
      } finally {
        setLoadingUser(false)
      }
    })

    return unsubscribe
  }, [])

  const value = {
    firebaseUser: authUser,
    authUser,
    userProfile,
    currentUser: authUser && !authUser.isAnonymous
      ? {
          uid: authUser.uid,
          email: authUser.email,
          ...userProfile,
        }
      : null,
    loadingUser,
    userError,
    refreshUserProfile,
    clearUserState,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
