const { spawn } = require('node:child_process')
const { loadEnvConfig } = require('@next/env')

loadEnvConfig(process.cwd())

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID in .env.local.')
  process.exit(1)
}

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const args = [
  '--yes',
  'firebase-tools',
  'emulators:start',
  '--only',
  'auth',
  '--project',
  projectId,
]

const child = spawn(executable, args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code || 0)
})
