export function isFirebaseAuthEmulatorEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR === 'true'
  )
}
