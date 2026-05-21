'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { DaySessionManager } from '@/lib/app/session'
import type { FlowState, Command, DailyFeedback } from '@/lib/types'

interface DayContextValue {
  flowState: FlowState
  dispatch: (cmd: Command) => Promise<void>
  feedback: DailyFeedback | null
}

const DayContext = createContext<DayContextValue | null>(null)

interface DayProviderProps {
  userId: string
  week: number
  day: number
  children: React.ReactNode
}

export function DayProvider({ userId, week, day, children }: DayProviderProps) {
  const sessionRef = useRef<DaySessionManager | null>(null)
  if (sessionRef.current === null) {
    sessionRef.current = new DaySessionManager()
  }

  const [loading, setLoading] = useState(true)
  const [flowState, setFlow] = useState<FlowState>({ phase: 'LOCKED' })
  const [feedback, setFeedback] = useState<DailyFeedback | null>(null)

  useEffect(() => {
    setLoading(true)
    sessionRef.current!
      .load(userId, week, day)
      .then(setFlow)
      .finally(() => setLoading(false))
  }, [userId, week, day])

  const dispatch = useCallback(async (cmd: Command) => {
    if (cmd.type === 'REQUEST_FEEDBACK') {
      const fb = await sessionRef.current!.requestFeedback()
      setFeedback(fb)
      return
    }
    const next = await sessionRef.current!.execute(cmd)
    setFlow(next)
  }, [])

  if (loading) return <DaySkeleton />

  return (
    <DayContext.Provider value={{ flowState, dispatch, feedback }}>
      {children}
    </DayContext.Provider>
  )
}

export function useDayContext(): DayContextValue {
  const ctx = useContext(DayContext)
  if (!ctx) throw new Error('useDayContext must be used within DayProvider')
  return ctx
}

function DaySkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  )
}
