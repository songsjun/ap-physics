'use client'

import { useEffect } from 'react'
import { ensureAppReady } from '@/lib/app/ready'

/**
 * Mounted once in the root layout. Kicks off the app initialisation
 * sequence (seed + unlock) so it begins as early as possible. All page
 * components that need ready data should also call ensureAppReady() and
 * await it — the singleton Promise ensures the work is never duplicated.
 */
export function AppInitializer() {
  useEffect(() => {
    ensureAppReady().catch(console.error)
  }, [])

  return null
}
