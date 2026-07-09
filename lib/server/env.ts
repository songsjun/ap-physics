import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

const DEFAULT_DATABASE_URL = 'postgres://localhost:5432/ap_physics'
const DEFAULT_SESSION_SECRET = 'dev-ap-physics-session-secret'

let loaded = false

export function loadAppEnv(): void {
  if (loaded) return
  loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)
  loaded = true
}

function isDevelopmentLike(): boolean {
  return !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
}

function configuredSecret(name: string): string | null {
  const value = process.env[name]?.trim()
  if (!value || value.startsWith('replace-with-')) return null
  return value
}

export function databaseUrl(): string {
  loadAppEnv()
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? DEFAULT_DATABASE_URL
}

export function sessionSecret(): string {
  loadAppEnv()
  const value = configuredSecret('SESSION_SECRET')
  if (value) return value
  if (isDevelopmentLike()) return DEFAULT_SESSION_SECRET
  throw new Error('SESSION_SECRET is required outside development')
}

export function accessCodeLookupSecret(): string {
  loadAppEnv()
  return configuredSecret('ACCESS_CODE_LOOKUP_SECRET') ?? sessionSecret()
}

export function sessionTtlSeconds(): number {
  loadAppEnv()
  const raw = process.env.SESSION_TTL_SECONDS
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 14 * 24 * 60 * 60
}

export function shouldUseSecureCookie(): boolean {
  loadAppEnv()
  return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
}
