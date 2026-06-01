'use client'

import { useEffect, useState } from 'react'
import { StorageService } from '@/lib/infra/storage'
import { repo } from '@/lib/repository'

export default function Home() {
  const [currentDay, setCurrentDay] = useState<{ week: number; day: number } | null>(null)

  useEffect(() => {
    async function findCurrentDay() {
      const userId = StorageService.userId.init()
      const unlocks = await repo.getUnlockedDays(userId)

      if (unlocks.length === 0) {
        setCurrentDay({ week: 1, day: 1 })
        return
      }

      // Find the latest unlocked day
      let maxWeek = 1, maxDay = 1
      for (const u of unlocks) {
        if (u.week > maxWeek || (u.week === maxWeek && u.day > maxDay)) {
          maxWeek = u.week
          maxDay = u.day
        }
      }
      setCurrentDay({ week: maxWeek, day: maxDay })
    }
    findCurrentDay().catch(() => setCurrentDay({ week: 1, day: 1 }))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100">AP Physics 1</h1>
        <p className="text-gray-500 dark:text-stone-400 mt-2">Adaptive Learning Platform</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {currentDay ? (
          <a
            href={`/week/${currentDay.week}/day/${currentDay.day}`}
            className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-xl font-medium transition-colors"
          >
            Continue → Week {currentDay.week} Day {currentDay.day}
          </a>
        ) : (
          <div className="h-12 bg-gray-200 dark:bg-stone-700 rounded-xl animate-pulse" />
        )}
        <a
          href="/dashboard"
          className="block bg-white hover:bg-gray-50 text-gray-700 text-center py-3 px-6 rounded-xl font-medium border border-gray-200 transition-colors dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-600 dark:text-stone-300"
        >
          View Progress Overview
        </a>
        <a
          href="/settings"
          className="block text-center py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors dark:text-stone-500 dark:hover:text-stone-400"
        >
          ⚙ Settings / Backup Progress
        </a>
      </div>
    </main>
  )
}
