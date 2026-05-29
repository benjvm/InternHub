export const DATA_BACKENDS = {
  firebase: 'firebase',
  supabase: 'supabase',
} as const

export type DataBackend = (typeof DATA_BACKENDS)[keyof typeof DATA_BACKENDS]

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function getPreferredDataBackend(): DataBackend {
  const configuredBackend = String(import.meta.env.VITE_DATA_BACKEND || '').trim().toLowerCase()

  if (configuredBackend === DATA_BACKENDS.firebase) {
    return DATA_BACKENDS.firebase
  }

  if (configuredBackend === DATA_BACKENDS.supabase && isSupabaseConfigured()) {
    return DATA_BACKENDS.supabase
  }

  return isSupabaseConfigured() ? DATA_BACKENDS.supabase : DATA_BACKENDS.firebase
}

export function shouldUseSupabase() {
  return getPreferredDataBackend() === DATA_BACKENDS.supabase
}
