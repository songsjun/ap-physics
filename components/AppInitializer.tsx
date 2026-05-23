'use client'

import { useEffect } from 'react'
import { ensureAppReady } from '@/lib/app/ready'
import { StorageService } from '@/lib/infra/storage'

/**
 * Applies the stored theme preference by toggling the `dark` class on
 * `<html>`. Called on hydration and whenever the system preference or
 * localStorage changes.
 */
function applyStoredTheme() {
  const t = StorageService.theme.get()
  const isDark =
    t === 'dark' ||
    (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

/**
 * Mounted once in the root layout. Kicks off the app initialisation
 * sequence (seed + unlock) so it begins as early as possible. Also
 * re-applies the theme on hydration and wires up listeners for:
 *   - system dark-mode preference changes (when theme = 'system')
 *   - cross-tab localStorage changes (so all tabs stay in sync)
 */
export function AppInitializer() {
  useEffect(() => {
    ensureAppReady().catch(console.error)
  }, [])

  useEffect(() => {
    // Re-apply theme on hydration (FOUC script may have missed edge cases).
    applyStoredTheme()

    // Re-apply when OS switches dark/light (only matters for theme='system').
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (StorageService.theme.get() === 'system') applyStoredTheme()
    }
    mq.addEventListener('change', handleSystemChange)

    // Sync theme across browser tabs.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ap_physics_theme') applyStoredTheme()
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      mq.removeEventListener('change', handleSystemChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return null
}

// Exported for use by SettingsClient so it can apply the theme immediately
// after saving without duplicating the logic.
export { applyStoredTheme }
