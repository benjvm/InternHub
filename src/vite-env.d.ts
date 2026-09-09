/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_BACKEND?: 'firebase' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_SITE_URL?: string
  readonly VITE_OPENROUTER_APP_NAME?: string
  readonly VITE_PUBLIC_FIREBASE_API_KEY?: string
  readonly VITE_PUBLIC_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_PUBLIC_FIREBASE_PROJECT_ID?: string
  readonly VITE_PUBLIC_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_PUBLIC_FIREBASE_APP_ID?: string
  readonly VITE_PUBLIC_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string
  readonly VITE_CLOUDINARY_PROFILE_FOLDER?: string
  readonly VITE_CLOUDINARY_CV_UPLOAD_PRESET?: string
  readonly VITE_CLOUDINARY_CV_FOLDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
