'use client'

import { useEffect } from 'react'
import { StorageService } from '@/lib/storage'
import { seedContentLibrary } from '@/lib/queries'
import { repo } from '@/lib/repository'

export function AppInitializer() {
  useEffect(() => {
    async function init() {
      const userId = StorageService.userId.init()
      await seedContentLibrary()
      // Week 1 Day 1 is always unlocked
      await repo.unlockDay(userId, 1, 1)
      // Request persistent storage to prevent Safari ITP clearing IndexedDB
      if (navigator.storage?.persist) {
        await navigator.storage.persist()
      }
    }
    init().catch(console.error)
  }, [])

  return null
}
