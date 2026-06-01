'use client'

import { useEffect, useState } from 'react'
import { StorageService } from '@/lib/infra/storage'
import { ensureAppReady } from '@/lib/app/ready'
import { DayProvider } from '@/lib/app/session-context'
import { DayListView } from '@/components/day/DayListView'
import { DaySkeleton } from '@/components/DaySkeleton'

export function DayPageClient({ week, day }: { week: number; day: number }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [initFailed, setInitFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureAppReady().then(() => {
      if (!cancelled) setUserId(StorageService.userId.init())
    }).catch(err => {
      console.error(err)
      if (!cancelled) setInitFailed(true)
    })
    return () => { cancelled = true }
  }, [])

  if (initFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <p className="font-semibold text-stone-800 text-sm">Initialization Failed</p>
          <p className="text-xs text-stone-500">Please check your network connection and refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!userId) return <DaySkeleton />

  return (
    <DayProvider userId={userId} week={week} day={day}>
      <DayListView week={week} day={day} />
    </DayProvider>
  )
}
