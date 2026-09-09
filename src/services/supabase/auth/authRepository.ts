import { getSupabaseClient } from '../client'
import { upsertUserProfile } from '../repositories/usersRepository'

const ROLE_FIELD_MAP: Record<number, string[]> = {
  1: ['nombre', 'apellido', 'universidad', 'carrera', 'correo'],
  2: ['nombreEmpresa', 'email'],
  3: ['nombreCompleto', 'correo', 'telefono'],
}

function normalizeRole(role: unknown) {
  const normalizedRole = Number(role)

  if (!ROLE_FIELD_MAP[normalizedRole]) {
    throw new Error('Rol de usuario no valido.')
  }

  return normalizedRole
}

function resolveEmail(role: number, userData: Record<string, any>) {
  if (role === 2) {
    return userData.email?.trim().toLowerCase() ?? ''
  }

  return userData.correo?.trim().toLowerCase() ?? ''
}

function buildUserProfile(role: number, userData: Record<string, any>) {
  const profile: Record<string, any> = { rol: role }

  ROLE_FIELD_MAP[role].forEach((field) => {
    if (userData[field] !== undefined) {
      profile[field] = typeof userData[field] === 'string' ? userData[field].trim() : userData[field]
    }
  })

  return profile
}

function mapAuthUser(user: any) {
  if (!user) {
    return null
  }

  return {
    ...user,
    uid: user.id || user.uid,
    isAnonymous: Boolean(user.is_anonymous || user.isAnonymous),
  }
}

export async function registerAuthUser(userData: Record<string, any>) {
  const role = normalizeRole(userData.rol)
  const email = resolveEmail(role, userData)
  const password = userData.password ?? userData.contrasena ?? ''

  if (!email || !password) {
    throw new Error('Correo y contrasena son obligatorios.')
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  })

  if (error) {
    throw error
  }

  const user = data.user

  if (!user) {
    throw new Error('No se pudo crear el usuario en Supabase Auth.')
  }

  const profile = buildUserProfile(role, userData)
  const emailField = role === 2 ? 'email' : 'correo'
  profile[emailField] = email

  await upsertUserProfile(user.id, {
    uid: user.id,
    ...profile,
  })

  return {
    uid: user.id,
    email: user.email,
    ...profile,
  }
}

export async function loginAuthUser(credentials: { email: string; password: string }) {
  if (!credentials.email || !credentials.password) {
    throw new Error('Correo y contrasena son obligatorios.')
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  })

  if (error) {
    throw error
  }

  return mapAuthUser(data.user)
}

export async function logoutAuthUser() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function resetAuthPassword(email: string) {
  const normalizedEmail = email?.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Indica tu correo electronico para restablecer la contrasena.')
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail)

  if (error) {
    throw error
  }
}

export async function getCurrentAuthUser() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return mapAuthUser(data.user)
}

export function onAuthUserChanged(callback: (user: any) => void) {
  const supabase = getSupabaseClient()
  const { data: authListener, error } = supabase.auth.onAuthStateChange((event, session) => {
    callback(mapAuthUser(session?.user))
  })

  if (error) {
    callback(null)
    return () => {}
  }

  return () => authListener?.subscription?.unsubscribe?.() ?? authListener?.unsubscribe?.()
}

