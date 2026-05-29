/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_BACKEND?: 'firebase' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_SITE_URL?: string
  readonly VITE_OPENROUTER_APP_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
