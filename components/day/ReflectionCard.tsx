'use client'

import { useState } from 'react'
import type { Resource, KnowledgePoint } from '@/lib/types'

// ── Reflection helpers ────────────────────────────────────────────────────────

function reflectionKey(week: number, day: number): string {
  return `reflection-${week}-${day}`
}

function loadReflectionState(week: number, day: number): ReflectionState {
  if (typeof window === 'undefined') return defaultReflection()
  try {
    const raw = localStorage.getItem(reflectionKey(week, day))
    if (raw) return JSON.parse(raw) as ReflectionState
  } catch { /* ignore */ }
  return defaultReflection()
}

function saveReflectionState(week: number, day: number, state: ReflectionState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(reflectionKey(week, day), JSON.stringify(state))
}

interface ReflectionState {
  feynmanDone: boolean
  errors: { concept: boolean; symbol: boolean; unit: boolean; reading: boolean }
  selfCheckDone: boolean
  completed: boolean
}

function defaultReflection(): ReflectionState {
  return {
    feynmanDone: false,
    errors: { concept: false, symbol: false, unit: false, reading: false },
    selfCheckDone: false,
    completed: false,
  }
}

// ── ReflectionCard ────────────────────────────────────────────────────────────

export function ReflectionCard({ week, day, concepts, aResources }: {
  week: number
  day: number
  concepts: KnowledgePoint[]
  aResources: Resource[]
}) {
  const [state, setState] = useState<ReflectionState>(() => loadReflectionState(week, day))

  const update = (patch: Partial<ReflectionState>) => {
    setState(prev => {
      const next = { ...prev, ...patch }
      saveReflectionState(week, day, next)
      return next
    })
  }

  const toggleError = (key: keyof ReflectionState['errors']) => {
    const next = { ...state.errors, [key]: !state.errors[key] }
    update({ errors: next })
  }

  // Build Feynman prompts from concept names
  const feynmanTopics = concepts
    .slice(0, 4)
    .map(k => k.name_zh)
    .filter(Boolean)

  // Build self-check items from A-tier resources
  const selfCheckItems = aResources
    .filter(r => r.type === 'exercise' || r.type === 'frq')
    .map(r => {
      const kps = r.concepts.map(id => concepts.find(k => k.id === id)).filter(Boolean) as KnowledgePoint[]
      const topic = kps[0]?.name_zh ?? ''
      if (r.type === 'frq') return `完成 FRQ 作答，逐点对照评分标准`
      if (topic) return `能用 ${topic} 相关公式解典型 AP 题目`
      return null
    })
    .filter(Boolean) as string[]

  const errorCount = Object.values(state.errors).filter(Boolean).length

  return (
    <div className={`rounded-xl border transition-colors ${
      state.completed ? 'bg-stone-50 border-stone-100' : 'bg-white border-stone-200'
    }`}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700">今日反思</span>
          <span className="text-xs text-stone-400">费曼 · 错题 · 自评</span>
        </div>
        {state.completed && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            已完成
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-4">

        {/* Feynman prompt */}
        {feynmanTopics.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-600">费曼口述：合书后说出以下概念</p>
              <button
                onClick={() => update({ feynmanDone: !state.feynmanDone })}
                className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                  state.feynmanDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {state.feynmanDone ? '✓ 完成' : '标记完成'}
              </button>
            </div>
            <ul className="space-y-0.5 pl-1">
              {feynmanTopics.map((t, i) => (
                <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                  <span className="text-stone-300 mt-0.5 shrink-0">·</span>
                  <span>{t} — 解释物理意义，写出相关公式</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error attribution */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-stone-600">
            今日错误类型
            {errorCount > 0 && (
              <span className="ml-1.5 text-amber-600 font-normal">（勾选了 {errorCount} 类）</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'concept', label: '概念混淆' },
              { key: 'symbol', label: '符号错误' },
              { key: 'unit', label: '单位错误' },
              { key: 'reading', label: '读题失误' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleError(key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  state.errors[key]
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {state.errors[key] ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Self-check */}
        {selfCheckItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-600">自评问题</p>
              <button
                onClick={() => update({ selfCheckDone: !state.selfCheckDone })}
                className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                  state.selfCheckDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {state.selfCheckDone ? '✓ 完成' : '标记完成'}
              </button>
            </div>
            <ul className="space-y-0.5 pl-1">
              {selfCheckItems.slice(0, 3).map((item, i) => (
                <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                  <span className="text-stone-300 mt-0.5 shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complete button */}
        <button
          onClick={() => update({ completed: !state.completed })}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            state.completed
              ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              : 'bg-stone-800 text-white hover:bg-stone-700'
          }`}
        >
          {state.completed ? '取消完成反思' : '完成今日反思'}
        </button>
      </div>
    </div>
  )
}
