'use client'

import { useEffect } from 'react'
import { StorageService } from '@/lib/infra/storage'
import { seedContentLibrary } from '@/lib/infra/seed'
import { seedQuizBank } from '@/lib/infra/seed-quiz'
import { repo } from '@/lib/repository'

export function AppInitializer() {
  useEffect(() => {
    async function init() {
      const userId = StorageService.userId.init()
      await Promise.all([seedContentLibrary(), seedQuizBank()])
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
