import { getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, initializeRecaptchaConfig } from 'firebase/auth'
import { isFirebaseAuthEmulatorEnabled } from '@/lib/firebase/emulator'

let authEmulatorConnected = false
let recaptchaConfigPromise: Promise<void> | null = null

function getFirebaseClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  }
}

export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig() !== null
}

export function getFirebaseAuth() {
  const config = getFirebaseClientConfig()

  if (!config) {
    throw new Error('Firebase phone auth is not configured. Check NEXT_PUBLIC_FIREBASE_* environment variables.')
  }

  const existingApps = getApps()
  const app = existingApps.find((candidate) => (
    candidate.options.apiKey === config.apiKey &&
    candidate.options.projectId === config.projectId &&
    candidate.options.appId === config.appId
  )) || initializeApp(config, existingApps.length === 0 ? undefined : 'phone-auth')

  const auth = getAuth(app)

  if (isFirebaseAuthEmulatorEnabled() && !authEmulatorConnected) {
    connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099', {
      disableWarnings: true,
    })
    authEmulatorConnected = true
  }

  return auth
}

export function prepareFirebasePhoneAuth(): Promise<void> {
  if (isFirebaseAuthEmulatorEnabled()) {
    return Promise.resolve()
  }

  if (!recaptchaConfigPromise) {
    recaptchaConfigPromise = initializeRecaptchaConfig(getFirebaseAuth()).catch((error) => {
      recaptchaConfigPromise = null
      throw error
    })
  }

  return recaptchaConfigPromise
}
