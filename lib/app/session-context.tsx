'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { DaySessionManager } from '@/lib/app/session'
import { DaySkeleton } from '@/components/DaySkeleton'
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
  const [loadError, setLoadError] = useState(false)
  const [flowState, setFlow] = useState<FlowState>({ phase: 'LOCKED' })
  const [feedback, setFeedback] = useState<DailyFeedback | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    sessionRef.current!
      .load(userId, week, day)
      .then(flowState => { if (!cancelled) setFlow(flowState) })
      .catch(err => { console.error(err); if (!cancelled) setLoadError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId, week, day])

  const inFlight = useRef(false)
  const feedbackInFlight = useRef(false)

  // Reset feedback state when the user navigates to a different day
  useEffect(() => {
    setFeedback(null)
    feedbackInFlight.current = false
  }, [userId, week, day])

  const dispatch = useCallback(async (cmd: Command) => {
    if (cmd.type === 'REQUEST_FEEDBACK') {
      if (feedbackInFlight.current) return
      feedbackInFlight.current = true
      try {
        const fb = await sessionRef.current!.requestFeedback()
        setFeedback(fb)
      } catch (err) {
        console.error('REQUEST_FEEDBACK failed:', err)
      } finally {
        feedbackInFlight.current = false
      }
      return
    }
    if (cmd.type === 'FORCE_ADVANCE') {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const next = await sessionRef.current!.forceAdvance()
        setFlow(next)
      } catch (err) {
        console.error('FORCE_ADVANCE failed:', err)
      } finally {
        inFlight.current = false
      }
      return
    }
    if (inFlight.current) return
    inFlight.current = true
    try {
      const next = await sessionRef.current!.execute(cmd)
      setFlow(next)
    } catch (err) {
      console.error('execute failed:', err)
    } finally {
      inFlight.current = false
    }
  }, [])

  if (loading) return <DaySkeleton />

  if (loadError) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <p className="font-semibold text-stone-800 text-sm">加载失败</p>
          <p className="text-xs text-stone-500">数据库访问出错，请刷新后重试</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

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

