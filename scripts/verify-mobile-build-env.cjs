/**
 * Ensures Vite env vars exist before embedding them into the Android APK build.
 * Run automatically via `npm run build:android`.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = {
  ...readEnvFile(path.join(root, '.env.local')),
  ...readEnvFile(envPath),
  ...process.env,
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const missing = required.filter((key) => !env[key] || env[key].includes('your-project') || env[key].includes('your-anon'))

if (missing.length > 0) {
  console.error('\n[Maktree Android build] Missing or placeholder env vars:\n')
  for (const key of missing) console.error(`  - ${key}`)
  console.error('\nCreate `.env` in the project root (copy from `.env.example`).')
  console.error('Use the same Supabase URL and anon key as your Vercel production portal.\n')
  process.exit(1)
}

console.log('[Maktree Android build] Env check passed.')
