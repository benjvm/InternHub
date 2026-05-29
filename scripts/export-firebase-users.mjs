import 'dotenv/config'
import fs from 'node:fs/promises'
import process from 'node:process'
import admin from 'firebase-admin'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
const outputPath = process.env.FIREBASE_USERS_EXPORT_PATH || 'firebase-users-export.json'

if (!serviceAccountPath) {
  throw new Error('Define FIREBASE_SERVICE_ACCOUNT_PATH con la ruta al JSON de service account.')
}

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

async function listAllUsers(nextPageToken, accumulator = []) {
  const result = await admin.auth().listUsers(1000, nextPageToken)
  accumulator.push(
    ...result.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      metadata: user.metadata,
      providerData: user.providerData,
    })),
  )

  if (result.pageToken) {
    return listAllUsers(result.pageToken, accumulator)
  }

  return accumulator
}

const users = await listAllUsers()
await fs.writeFile(outputPath, JSON.stringify(users, null, 2), 'utf8')
console.log(`Exportados ${users.length} usuarios a ${outputPath}.`)
