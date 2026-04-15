import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const USERS_COLLECTION = 'users'

const UserContext = createContext({
  firebaseUser: null,
  userProfile: null,
  currentUser: null,
  loadingUser: true,
  userError: null,
  refreshUserProfile: async () => null,
  clearUserState: () => {},
})

async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export function UserProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userError, setUserError] = useState(null)

  const clearUserState = () => {
    setFirebaseUser(null)
    setUserProfile(null)
    setUserError(null)
  }

  const refreshUserProfile = async (uid = auth.currentUser?.uid) => {
    if (!uid) {
      setUserProfile(null)
      return null
    }

    try {
      setUserError(null)
      const profile = await fetchUserProfile(uid)
      setUserProfile(profile)
      return profile
    } catch (error) {
      setUserError(error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingUser(true)

      if (!user) {
        clearUserState()
        setLoadingUser(false)
        return
      }

      try {
        setFirebaseUser(user)
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
    firebaseUser,
    userProfile,
    currentUser: firebaseUser
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
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

export { fetchUserProfile }
