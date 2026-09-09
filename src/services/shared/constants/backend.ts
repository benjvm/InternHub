export const DATA_BACKENDS = {
  supabase: 'supabase',
} as const

export type DataBackend = (typeof DATA_BACKENDS)[keyof typeof DATA_BACKENDS]

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function getPreferredDataBackend(): DataBackend {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tus variables de entorno.',
    )
  }

  return DATA_BACKENDS.supabase
}

export function shouldUseSupabase() {
  return true
}
