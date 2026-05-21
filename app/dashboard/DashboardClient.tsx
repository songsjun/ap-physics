'use client'

import { useEffect, useState } from 'react'
import { StorageService } from '@/lib/infra/storage'
import { getDb } from '@/lib/infra/db'
import { WEEKS, DAYS_PER_WEEK, PASS_THRESHOLD } from '@/lib/constants'

interface DayStatus {
  week: number
  day: number
  unlocked: boolean
  aTotal: number
  aDone: number
  passRate: number | null
}

export function DashboardClient() {
  const [days, setDays] = useState<DayStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const userId = StorageService.userId.init()
      const db = getDb()

      const [allResources, allCompletions, allUnlocks] = await Promise.all([
        db.resources.toArray(),
        db.completions.where('user_id').equals(userId).toArray(),
        db.day_unlocks.where('user_id').equals(userId).toArray(),
      ])

      const unlockedSet = new Set(allUnlocks.map(u => `${u.week}-${u.day}`))
      const completionMap = new Map(allCompletions.map(c => [c.resource_id, c]))

      const result: DayStatus[] = []
      for (let w = 1; w <= WEEKS; w++) {
        for (let d = 1; d <= DAYS_PER_WEEK; d++) {
          const aResources = allResources.filter(r => r.week === w && r.day === d && r.tier === 'A')
          const aDone = aResources.filter(r => {
            const c = completionMap.get(r.id)
            return c && c.status !== 'skipped'
          }).length

          let passRate: number | null = null
          if (aDone > 0) {
            const passed = aResources.filter(r => completionMap.get(r.id)?.status === 'passed').length
            const failed = aResources.filter(r => completionMap.get(r.id)?.status === 'failed').length
            const graded = passed + failed
            passRate = graded > 0 ? passed / graded : null
          }

          result.push({
            week: w, day: d,
            unlocked: unlockedSet.has(`${w}-${d}`),
            aTotal: aResources.length,
            aDone,
            passRate,
          })
        }
      }

      setDays(result)
      setLoading(false)
    }
    load().catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-stone-200/60 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  // Summary stats
  const completedDays = days.filter(d => d.aDone > 0 && d.aDone === d.aTotal && d.aTotal > 0)
  const unlockedDays = days.filter(d => d.unlocked)
  const totalDays = WEEKS * DAYS_PER_WEEK
  const progressPct = Math.round((completedDays.length / totalDays) * 100)

  // Find current day (latest unlocked, not yet completed)
  const currentDay = [...unlockedDays].reverse().find(d => d.aDone < d.aTotal) ?? unlockedDays[unlockedDays.length - 1]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">学习进度</h1>
          <p className="text-sm text-stone-400 mt-0.5">AP Physics 1  ·  8 周 56 天</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-stone-500 hover:text-stone-900 transition-colors">← 返回</a>
          <a href="/settings" className="text-stone-400 hover:text-stone-600 transition-colors">⚙ 设置</a>
        </div>
      </div>

      {/* Progress summary bar */}
      <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-5">
            <div>
              <span className="text-2xl font-bold text-stone-900">{completedDays.length}</span>
              <span className="text-stone-400 ml-1 text-xs">/ {totalDays} 天完成</span>
            </div>
            {currentDay && (
              <div className="pl-5 border-l border-stone-100">
                <span className="text-xs text-stone-400">当前进度</span>
                <p className="text-sm font-medium text-stone-700">
                  Week {currentDay.week} · Day {currentDay.day}
                </p>
              </div>
            )}
          </div>
          <span className="text-stone-400 text-sm font-medium">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Week grids */}
      <div className="space-y-3">
        {Array.from({ length: WEEKS }, (_, wi) => {
          const week = wi + 1
          const weekDays = days.filter(d => d.week === week)
          const weekDone = weekDays.filter(d => d.aDone === d.aTotal && d.aTotal > 0).length
          const isCurrentWeek = currentDay?.week === week
          const isLockedWeek = weekDays.every(d => !d.unlocked)

          return (
            <div
              key={week}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isLockedWeek ? 'border-stone-100 opacity-60' :
                isCurrentWeek ? 'border-blue-200 shadow-sm shadow-blue-50' :
                'border-stone-100'
              }`}
            >
              {/* Week header */}
              <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                isCurrentWeek ? 'bg-blue-50 border-blue-100' : 'bg-stone-50 border-stone-50'
              }`}>
                <div className="flex items-center gap-2">
                  {isCurrentWeek && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <span className={`text-sm font-semibold ${isCurrentWeek ? 'text-blue-800' : 'text-stone-600'}`}>
                    Week {week}
                  </span>
                </div>
                <span className="text-xs text-stone-400">{weekDone}/{DAYS_PER_WEEK} 天</span>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {weekDays.map(d => (
                  <DayCell key={`${d.week}-${d.day}`} status={d} isCurrent={
                    currentDay?.week === d.week && currentDay?.day === d.day
                  } />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-stone-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />通过
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />进行中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />待开始
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" />需重试
        </span>
      </div>
    </div>
  )
}

function DayCell({ status, isCurrent }: { status: DayStatus; isCurrent: boolean }) {
  const { week, day, unlocked, aTotal, aDone, passRate } = status
  const isComplete = aTotal > 0 && aDone === aTotal
  const isStarted = aDone > 0 && !isComplete
  const isPassed = isComplete && passRate !== null && passRate >= PASS_THRESHOLD
  const needsRetry = isComplete && passRate !== null && passRate < PASS_THRESHOLD

  // Visual state
  let cellBg = 'bg-stone-50'
  let dayNumCls = 'text-stone-300'
  let indicator: React.ReactNode = null

  if (!unlocked) {
    cellBg = 'bg-stone-50'
    dayNumCls = 'text-stone-300'
    indicator = (
      <svg className="w-3.5 h-3.5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    )
  } else if (isPassed) {
    cellBg = 'bg-emerald-50 hover:bg-emerald-100'
    dayNumCls = 'text-emerald-700'
    indicator = (
      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    )
  } else if (needsRetry) {
    cellBg = 'bg-orange-50 hover:bg-orange-100'
    dayNumCls = 'text-orange-700'
    indicator = (
      <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    )
  } else if (isStarted) {
    cellBg = 'bg-amber-50 hover:bg-amber-100'
    dayNumCls = 'text-amber-700'
    indicator = (
      <div className="flex gap-0.5">
        {Array.from({ length: status.aTotal }).map((_, i) => (
          <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < aDone ? 'bg-amber-400' : 'bg-amber-200'}`} />
        ))}
      </div>
    )
  } else if (unlocked) {
    cellBg = 'bg-blue-50 hover:bg-blue-100'
    dayNumCls = 'text-blue-700'
    indicator = (
      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>
    )
  }

  const subText = aTotal > 0 ? (
    <span className="text-[10px] text-stone-400">
      {aDone}/{aTotal}
      {passRate !== null && (
        <span className={passRate >= PASS_THRESHOLD ? 'text-emerald-500' : 'text-orange-400'}>
          {' '}{Math.round(passRate * 100)}%
        </span>
      )}
    </span>
  ) : null

  const inner = (
    <div className={`py-3 flex flex-col items-center gap-1.5 ${cellBg} transition-colors ${
      isCurrent ? 'ring-1 ring-inset ring-blue-400' : ''
    }`}>
      <span className={`text-[11px] font-semibold ${dayNumCls}`}>D{day}</span>
      <div className="flex items-center justify-center h-4">{indicator}</div>
      {subText}
    </div>
  )

  if (!unlocked) return <div className="border-r border-stone-50 last:border-r-0">{inner}</div>

  return (
    <a href={`/week/${week}/day/${day}`} className="block border-r border-stone-50 last:border-r-0">
      {inner}
    </a>
  )
}
