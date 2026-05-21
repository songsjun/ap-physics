'use client'

import { useEffect, useState } from 'react'
import { StorageService } from '@/lib/storage'
import { DayProvider } from '@/lib/app/session-context'
import { DayListView } from '@/components/DayListView'

export function DayPageClient({ week, day }: { week: number; day: number }) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(StorageService.userId.init())
  }, [])

  if (!userId) return null // brief flash before userId is available

  return (
    <DayProvider userId={userId} week={week} day={day}>
      <DayListView week={week} day={day} />
    </DayProvider>
  )
}
