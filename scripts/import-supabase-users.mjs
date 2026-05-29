import 'dotenv/config'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const inputPath = process.env.FIREBASE_USERS_EXPORT_PATH || 'firebase-users-export.json'
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Define VITE_SUPABASE_URL/SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const users = JSON.parse(await fs.readFile(inputPath, 'utf8'))

for (const firebaseUser of users) {
  const { error } = await supabase.auth.admin.createUser({
    email: firebaseUser.email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      legacy_firebase_uid: firebaseUser.uid,
      requires_password_reset: true,
    },
  })

  if (error && !String(error.message).includes('already registered')) {
    throw error
  }
}

console.log(`Importados ${users.length} usuarios en Supabase Auth. Deben ejecutar reset password.`)
