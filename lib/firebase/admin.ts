import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getFirebaseAdminCredentials() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    const parsed = JSON.parse(serviceAccountKey)
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    )
  }

  return { projectId, clientEmail, privateKey }
}

export function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(getFirebaseAdminCredentials()),
    })
  }

  return getAuth()
}
