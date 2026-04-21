import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const USERS_COLLECTION = 'users'

const ROLE_FIELD_MAP = {
  1: ['nombre', 'apellido', 'universidad', 'carrera', 'correo'],
  2: ['nombreEmpresa', 'email'],
  3: ['nombreCompleto', 'correo', 'telefono'],
}

function normalizeRole(role) {
  const normalizedRole = Number(role)

  if (!ROLE_FIELD_MAP[normalizedRole]) {
    throw new Error('Rol de usuario no valido.')
  }

  return normalizedRole
}

function resolveEmail(role, userData) {
  if (role === 2) {
    return userData.email?.trim().toLowerCase() ?? ''
  }

  return userData.correo?.trim().toLowerCase() ?? ''
}

function buildUserProfile(role, userData) {
  const profile = { rol: role }

  ROLE_FIELD_MAP[role].forEach((field) => {
    if (userData[field] !== undefined) {
      profile[field] = typeof userData[field] === 'string' ? userData[field].trim() : userData[field]
    }
  })

  return profile
}

export async function registerUser(userData) {
  const role = normalizeRole(userData.rol)
  const email = resolveEmail(role, userData)
  const password = userData.password ?? userData.contrasena ?? ''

  if (!email || !password) {
    throw new Error('Correo y contrasena son obligatorios.')
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = credential

  const profile = buildUserProfile(role, userData)
  const emailField = role === 2 ? 'email' : 'correo'
  profile[emailField] = email

  await setDoc(doc(db, USERS_COLLECTION, user.uid), {
    uid: user.uid,
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    uid: user.uid,
    email: user.email,
    ...profile,
  }
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Correo y contrasena son obligatorios.')
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
  return credential.user
}

export function logoutUser() {
  return signOut(auth)
}
