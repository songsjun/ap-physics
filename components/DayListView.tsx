'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useDayContext } from '@/lib/app/session-context'
import { getDb } from '@/lib/infra/db'
import { StorageService } from '@/lib/infra/storage'
import type { Resource, Completion, KnowledgePoint, DailyFeedback } from '@/lib/types'
import { findRelatedFRQ, frqTypeLabel } from '@/lib/domain/frq'
import type { FRQEntry } from '@/lib/domain/frq'
import { PASS_THRESHOLD } from '@/lib/constants'

// ── Phase visual system ───────────────────────────────────────────────────────

const PHASE_STYLE: Record<string, {
  label: string
  badgeCls: string
  borderCls: string
  rowBg: string
}> = {
  LEARN: {
    label: '学习',
    badgeCls: 'bg-amber-100 text-amber-700',
    borderCls: 'border-l-amber-400',
    rowBg: 'bg-amber-50/40',
  },
  PRACTICE: {
    label: '练习',
    badgeCls: 'bg-blue-100 text-blue-700',
    borderCls: 'border-l-blue-400',
    rowBg: 'bg-blue-50/40',
  },
  CHECK: {
    label: '检测',
    badgeCls: 'bg-violet-100 text-violet-700',
    borderCls: 'border-l-violet-400',
    rowBg: 'bg-violet-50/40',
  },
}

const PLATFORM_SHORT: Record<string, string> = {
  khan: 'Khan', openstax: 'OpenStax', phet: 'PhET',
  flipping: 'Flipping', ap_central: 'AP Central', native: '平台',
}

const TYPE_LABEL: Record<string, string> = {
  video: '视频', exercise: '练习', reading: '阅读',
  interactive: '实验', frq: 'FRQ',
}

// Default score_max by resource type / platform
function defaultScoreMax(r: Resource): number {
  if (r.platform === 'khan' && r.type === 'exercise') return 4
  if (r.type === 'frq') return 10
  return 5
}

function isGradedResource(r: Resource): boolean {
  return r.type === 'exercise' || r.type === 'frq'
}

// ── Derived annotations ───────────────────────────────────────────────────────

function getCompletionCriteria(r: Resource): string {
  if (r.platform === 'khan' && r.type === 'exercise') return '4 题，目标 ≥ 3 题正确（75%）'
  if (r.platform === 'khan' && r.type === 'video') return '完整观看，记录关键概念和公式'
  if (r.platform === 'khan' && r.type === 'reading') return '阅读互动文章，完成嵌入练习'
  if (r.type === 'interactive') return '完成实验步骤，记录观察结论，建立物理直觉'
  if (r.platform === 'openstax' && r.type === 'reading') return '阅读并理解核心定义，能口述要点'
  if (r.platform === 'openstax' && r.type === 'exercise') return '完成练习题，用答案键核对过程'
  if (r.type === 'frq') return '完成 FRQ 作答，对照评分标准逐点自评'
  if (r.platform === 'flipping') return '观看补强视频，针对卡点概念做笔记'
  return `完成 ${r.estimated_minutes} 分钟学习任务`
}

function getLearningObjective(r: Resource, kps: KnowledgePoint[]): string {
  const topicsZh = kps.map(k => k.name_zh).join('、')
  if (!topicsZh) return ''
  const prefix: Record<string, string> = {
    video: `理解 ${topicsZh} 的物理意义和数学表达`,
    exercise: `运用 ${topicsZh} 解决典型 AP 题目`,
    interactive: `通过实验直观感受 ${topicsZh} 的规律`,
    reading: `深入理解 ${topicsZh} 的定义与推导过程`,
    frq: `综合运用本周知识完成开放性 FRQ 作答`,
  }
  return prefix[r.type] ?? `完成 ${topicsZh} 相关学习`
}

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

// ── Main component ────────────────────────────────────────────────────────────

export function DayListView({ week, day }: { week: number; day: number }) {
  const { dispatch, flowState, feedback } = useDayContext()
  const [resources, setResources] = useState<Resource[]>([])
  const [completions, setCompletions] = useState<Map<string, Completion>>(new Map())
  const [kpMap, setKpMap] = useState<Map<string, KnowledgePoint>>(new Map())
  const [loading, setLoading] = useState(true)
  // id of resource currently in score-input mode
  const [scoringId, setScoringId] = useState<string | null>(null)
  const feedbackRequestedRef = useRef(false)

  useEffect(() => {
    if (flowState.phase === 'COMPLETE' && !feedbackRequestedRef.current) {
      feedbackRequestedRef.current = true
      dispatch({ type: 'REQUEST_FEEDBACK' }).catch((err) => {
        console.error(err)
        feedbackRequestedRef.current = false
      })
    }
  }, [flowState.phase, dispatch])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const userId = StorageService.userId.get()
      if (!userId) return
      const db = getDb()
      const allRes = await db.resources.where({ week, day }).sortBy('slot_order')
      if (cancelled) return
      const conceptIds = [...new Set(allRes.flatMap(r => r.concepts))]
      const kps = await db.knowledge_points.bulkGet(conceptIds)
      if (cancelled) return
      const newKpMap = new Map<string, KnowledgePoint>()
      kps.forEach(kp => { if (kp) newKpMap.set(kp.id, kp) })
      setResources(allRes)
      setKpMap(newKpMap)
      setLoading(false)
    }
    load().catch(console.error)
    return () => { cancelled = true }
  }, [week, day])

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const userId = StorageService.userId.get()
      if (!userId) return
      const db = getDb()
      const allRes = await db.resources.where({ week, day }).toArray()
      if (cancelled) return
      const allComp = await db.completions.where('user_id').equals(userId).toArray()
      if (cancelled) return
      const resIds = new Set(allRes.map(r => r.id))
      setCompletions(new Map(
        allComp.filter(c => resIds.has(c.resource_id)).map(c => [c.resource_id, c])
      ))
    }
    refresh().catch(console.error)
    return () => { cancelled = true }
  }, [week, day, flowState])

  // For non-graded resources: mark complete immediately
  const handleCheckDirect = useCallback(async (r: Resource) => {
    if (completions.get(r.id)?.status === 'passed') return
    await dispatch({ type: 'COMPLETE_RESOURCE', resourceId: r.id, result: { status: 'passed' } })
  }, [completions, dispatch])

  // For graded resources: open score panel
  const handleCheckGraded = useCallback((r: Resource) => {
    if (completions.get(r.id)?.status === 'passed') return
    setScoringId(r.id)
  }, [completions])

  const handleScoreSubmit = useCallback(async (r: Resource, score: number, scoreMax: number) => {
    setScoringId(null)
    const passed = score / scoreMax >= PASS_THRESHOLD
    await dispatch({
      type: 'COMPLETE_RESOURCE',
      resourceId: r.id,
      result: { status: passed ? 'passed' : 'failed', score, score_max: scoreMax },
    })
  }, [dispatch])

  const handleScoreCancel = useCallback(() => setScoringId(null), [])

  if (loading) {
    return (
      <div className="space-y-3 max-w-2xl mx-auto px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-stone-200/60 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (flowState.phase === 'LOCKED') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <p className="text-stone-500 text-sm">完成上一天的必做任务后解锁</p>
      </div>
    )
  }

  const aTier = resources.filter(r => r.tier === 'A')
  const bTier = resources.filter(r => r.tier === 'B')
  const cTier = resources.filter(r => r.tier === 'C')

  const aPassed = aTier.filter(r => completions.get(r.id)?.status === 'passed').length
  const aFailed = aTier.filter(r => completions.get(r.id)?.status === 'failed').length
  const aGraded = aPassed + aFailed
  const passRate = aGraded > 0 ? aPassed / aGraded : null
  const aTotalMin = aTier.reduce((s, r) => s + r.estimated_minutes, 0)
  const hasAFailed = aTier.some(r => completions.get(r.id)?.status === 'failed')

  // Unique concepts from all A-tier resources (for reflection card)
  const aConcepts = [...new Set(aTier.flatMap(r => r.concepts))]
    .map(id => kpMap.get(id))
    .filter(Boolean) as KnowledgePoint[]

  const rowProps = { completions, kpMap, scoringId, onCheckDirect: handleCheckDirect, onCheckGraded: handleCheckGraded, onScoreSubmit: handleScoreSubmit, onScoreCancel: handleScoreCancel }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

      {/* Complete banner */}
      {flowState.phase === 'COMPLETE' && (
        <CompleteBanner passRate={flowState.passRate} feedback={feedback} />
      )}

      {/* A 必做 */}
      {aTier.length > 0 ? (
        <TierSection
          tier="A"
          label="必做"
          accentCls="text-blue-700"
          headerBg="bg-blue-50"
          borderCls="border-blue-100"
          description={`约 ${aTotalMin} 分钟`}
          statusText={`${aPassed}/${aTier.length} 完成${passRate !== null ? `  ·  ${Math.round(passRate * 100)}%` : ''}`}
          resources={aTier}
          defaultOpen
          {...rowProps}
        />
      ) : (
        <div className="bg-white rounded-xl border border-stone-100 px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">今日为自由学习日</p>
            <p className="text-xs text-stone-400">无必做任务，下一天已自动解锁</p>
          </div>
        </div>
      )}

      {/* B 建议 */}
      {bTier.length > 0 && (
        <TierSection
          tier="B"
          label="建议补充"
          accentCls="text-amber-700"
          headerBg="bg-amber-50"
          borderCls="border-amber-100"
          description="A 层 < 75% 或概念卡点时使用"
          statusText=""
          resources={bTier}
          defaultOpen={false}
          forceOpen={hasAFailed}
          {...rowProps}
        />
      )}

      {/* C 拓展 */}
      {cTier.length > 0 && (
        <TierSection
          tier="C"
          label="拓展"
          accentCls="text-stone-500"
          headerBg="bg-stone-50"
          borderCls="border-stone-100"
          description="100% 覆盖 / 二轮返工"
          statusText=""
          resources={cTier}
          defaultOpen={false}
          {...rowProps}
        />
      )}

      {/* 相关 FRQ 真题 */}
      {aConcepts.length > 0 && (
        <RelatedFRQCard conceptIds={aConcepts.map(k => k.id)} />
      )}

      {/* 今日反思 */}
      {aTier.length > 0 && (
        <ReflectionCard week={week} day={day} concepts={aConcepts} aResources={aTier} />
      )}
    </div>
  )
}

// ── CompleteBanner ────────────────────────────────────────────────────────────

function CompleteBanner({ passRate, feedback }: { passRate: number; feedback: DailyFeedback | null }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-900 text-sm">今日完成</p>
          <p className="text-xs text-emerald-600">通过率 {Math.round(passRate * 100)}%  ·  下一天已解锁</p>
        </div>
      </div>
      {feedback ? (
        <div className="space-y-1.5 text-sm border-t border-emerald-200 pt-3 pl-1">
          <p className="text-stone-700">💪 {feedback.strength}</p>
          {feedback.note && <p className="text-stone-600">📝 {feedback.note}</p>}
          {feedback.preview && <p className="text-stone-500">👀 明日：{feedback.preview}</p>}
        </div>
      ) : (
        <p className="text-xs text-emerald-500 pl-1 animate-pulse">正在获取 AI 学习反馈…</p>
      )}
    </div>
  )
}

// ── TierSection ───────────────────────────────────────────────────────────────

interface RowSharedProps {
  completions: Map<string, Completion>
  kpMap: Map<string, KnowledgePoint>
  scoringId: string | null
  onCheckDirect: (r: Resource) => void
  onCheckGraded: (r: Resource) => void
  onScoreSubmit: (r: Resource, score: number, scoreMax: number) => void
  onScoreCancel: () => void
}

interface TierSectionProps extends RowSharedProps {
  tier: 'A' | 'B' | 'C'
  label: string
  accentCls: string
  headerBg: string
  borderCls: string
  description: string
  statusText: string
  resources: Resource[]
  defaultOpen: boolean
  forceOpen?: boolean
}

function TierSection({
  tier, label, accentCls, headerBg, borderCls,
  description, statusText, resources, defaultOpen, forceOpen,
  ...rowProps
}: TierSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { if (forceOpen) setOpen(true) }, [forceOpen])

  return (
    <div className={`bg-white rounded-xl border ${borderCls} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full px-4 py-2.5 flex items-center justify-between ${headerBg} hover:brightness-95 transition-all text-left`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            tier === 'A' ? 'bg-blue-600 text-white' :
            tier === 'B' ? 'bg-amber-500 text-white' :
                           'bg-stone-400 text-white'
          }`}>{tier}</span>
          <span className={`text-sm font-medium ${accentCls}`}>{label}</span>
          {description && <span className="text-xs text-stone-400">{description}</span>}
        </div>
        <div className="flex items-center gap-2">
          {statusText && <span className="text-xs text-stone-500">{statusText}</span>}
          <svg
            className={`w-3.5 h-3.5 text-stone-300 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-stone-50">
          {resources.map(r => (
            <ResourceRow
              key={r.id}
              resource={r}
              completion={rowProps.completions.get(r.id)}
              kpMap={rowProps.kpMap}
              scoringId={rowProps.scoringId}
              onCheckDirect={rowProps.onCheckDirect}
              onCheckGraded={rowProps.onCheckGraded}
              onScoreSubmit={rowProps.onScoreSubmit}
              onScoreCancel={rowProps.onScoreCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── ScorePanel ────────────────────────────────────────────────────────────────

function ScorePanel({ resource, onSubmit, onCancel }: {
  resource: Resource
  onSubmit: (score: number, scoreMax: number) => void
  onCancel: () => void
}) {
  const max = defaultScoreMax(resource)
  const [score, setScore] = useState(0)

  const pct = Math.round((score / max) * 100)
  const willPass = score / max >= PASS_THRESHOLD

  return (
    <div className="mx-4 mb-3 ml-12 mt-1">
      <div className="bg-stone-50 rounded-lg border border-stone-200 p-3 space-y-3">
        <p className="text-xs font-medium text-stone-600">
          {resource.type === 'frq' ? '得了几分？' : '几题答对了？'}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScore(s => Math.max(0, s - 1))}
            className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-600 font-bold text-lg flex items-center justify-center hover:bg-stone-100 transition-colors"
          >−</button>
          <div className="flex items-baseline gap-1.5 min-w-[4rem] justify-center">
            <span className="text-2xl font-bold text-stone-800 tabular-nums">{score}</span>
            <span className="text-sm text-stone-400">/ {max}</span>
          </div>
          <button
            onClick={() => setScore(s => Math.min(max, s + 1))}
            className="w-8 h-8 rounded-lg bg-white border border-stone-200 text-stone-600 font-bold text-lg flex items-center justify-center hover:bg-stone-100 transition-colors"
          >+</button>
          <div className={`ml-1 text-xs font-medium px-2 py-1 rounded-md ${
            willPass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
          }`}>
            {pct}%{willPass ? ' ✓' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(score, max)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              willPass
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
          >
            {willPass ? '通过' : '未达标'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ResourceRow ───────────────────────────────────────────────────────────────

function ResourceRow({ resource, completion, kpMap, scoringId, onCheckDirect, onCheckGraded, onScoreSubmit, onScoreCancel }: {
  resource: Resource
  completion: Completion | undefined
  kpMap: Map<string, KnowledgePoint>
  scoringId: string | null
  onCheckDirect: (r: Resource) => void
  onCheckGraded: (r: Resource) => void
  onScoreSubmit: (r: Resource, score: number, scoreMax: number) => void
  onScoreCancel: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const done = completion?.status === 'passed'
  const failed = completion?.status === 'failed'
  const isScoring = scoringId === resource.id

  const phase = PHASE_STYLE[resource.phase] ?? PHASE_STYLE.PRACTICE
  const kps = resource.concepts.map(id => kpMap.get(id)).filter(Boolean) as KnowledgePoint[]
  const cedCodes = [...new Set(kps.map(k => k.ced_topic))].join(', ')
  const objective = getLearningObjective(resource, kps)
  const criteria = getCompletionCriteria(resource)
  const openstaxSections = [...new Set(kps.flatMap(k => k.openstax_sections))]
  const typeLabel = TYPE_LABEL[resource.type] ?? resource.type
  const platformLabel = PLATFORM_SHORT[resource.platform] ?? resource.platform
  const graded = isGradedResource(resource)

  const rowBg = done ? 'bg-emerald-50/30' : phase.rowBg

  // Score display if recorded
  const scoreDisplay = done && completion?.score !== undefined && completion.score_max
    ? `${completion.score}/${completion.score_max}`
    : null
  const failedScoreDisplay = failed && completion?.score !== undefined && completion.score_max
    ? `${completion.score}/${completion.score_max}`
    : null

  return (
    <div className={`border-l-[3px] ${done ? 'border-l-emerald-400' : failed ? 'border-l-red-300' : phase.borderCls} transition-colors`}>

      {/* Main row */}
      <div className={`flex items-start gap-3 px-4 pt-3 pb-2 ${rowBg}`}>

        {/* Checkbox */}
        <button
          onClick={() => {
            if (done) return
            if (graded) onCheckGraded(resource)
            else onCheckDirect(resource)
          }}
          aria-label={done ? '已完成' : '标记完成'}
          className={`mt-0.5 w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all ${
            done   ? 'bg-emerald-500 border-emerald-500 shadow-sm' :
            failed ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                     'border-stone-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {done && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {failed && <span className="text-red-400 text-[10px] leading-none font-bold">✕</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2">
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium leading-snug transition-colors flex-1 ${
                  done ? 'text-stone-400 line-through' : 'text-stone-800 hover:text-blue-600'
                }`}
              >
                {resource.title}
              </a>
            ) : (
              <span className={`text-sm font-medium leading-snug flex-1 ${done ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                {resource.title}
              </span>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${phase.badgeCls}`}>
                {phase.label}
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline">{typeLabel}</span>
              <span className="text-[11px] text-stone-300 hidden sm:inline">{platformLabel}</span>
              {/* Score display */}
              {scoreDisplay && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  {scoreDisplay}
                </span>
              )}
              {failedScoreDisplay && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">
                  {failedScoreDisplay}
                </span>
              )}
              {!scoreDisplay && !failedScoreDisplay && (
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                  done ? 'text-stone-400 bg-stone-100' : 'text-stone-500 bg-stone-100'
                }`}>
                  {resource.estimated_minutes}m
                </span>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-300 hover:text-blue-500 transition-colors"
                  aria-label="在新标签页打开"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Subtitle row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {cedCodes && (
              <span className="text-[11px] text-stone-400 font-mono">CED {cedCodes}</span>
            )}
            {kps.slice(0, 2).map(kp => (
              <span key={kp.id} className="text-[11px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">
                {kp.name_zh}
              </span>
            ))}
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[11px] text-blue-400 hover:text-blue-600 transition-colors ml-0.5"
            >
              {expanded ? '收起' : '详情'}
            </button>
          </div>
        </div>
      </div>

      {/* Score input panel */}
      {isScoring && (
        <ScorePanel
          resource={resource}
          onSubmit={(score, max) => onScoreSubmit(resource, score, max)}
          onCancel={onScoreCancel}
        />
      )}

      {/* Expandable detail */}
      {expanded && !isScoring && (
        <div className={`mx-4 mb-3 ml-12 pl-3 border-l border-stone-100 space-y-1.5 text-xs text-stone-500 ${rowBg}`}>
          {objective && (
            <div className="flex gap-2 pt-1">
              <span className="text-stone-300 shrink-0 w-14 text-right">学习目标</span>
              <span className="text-stone-600">{objective}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-stone-300 shrink-0 w-14 text-right">完成标准</span>
            <span className="text-stone-600">{criteria}</span>
          </div>
          {/* Answer key link */}
          {resource.answer_url && (
            <div className="flex gap-2">
              <span className="text-stone-300 shrink-0 w-14 text-right">答案</span>
              <a
                href={resource.answer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline underline-offset-2"
              >
                查看答案键 →
              </a>
            </div>
          )}
          {kps.length > 0 && (
            <div className="flex gap-2">
              <span className="text-stone-300 shrink-0 w-14 text-right">知识点</span>
              <span className="text-stone-600">
                {kps.map(k => `CED ${k.ced_topic} ${k.name_en}`).join('  ·  ')}
              </span>
            </div>
          )}
          {openstaxSections.length > 0 && (
            <div className="flex gap-2">
              <span className="text-stone-300 shrink-0 w-14 text-right">OpenStax</span>
              <span className="text-stone-600">第 {openstaxSections.join(', ')} 节</span>
            </div>
          )}
          {resource.type === 'exercise' && resource.platform === 'khan' && (
            <div className="flex gap-2">
              <span className="text-stone-300 shrink-0 w-14 text-right">达成含义</span>
              <span className="text-stone-600">75% 正确率代表对该知识点有基础掌握，可推进下一模块</span>
            </div>
          )}
          {resource.type === 'interactive' && (
            <div className="flex gap-2">
              <span className="text-stone-300 shrink-0 w-14 text-right">达成含义</span>
              <span className="text-stone-600">实验建立的直觉将帮助你在 FRQ 中正确设定符号和方向</span>
            </div>
          )}
          {resource.type === 'frq' && (
            <div className="flex gap-2 pb-1">
              <span className="text-stone-300 shrink-0 w-14 text-right">达成含义</span>
              <span className="text-stone-600">FRQ 是 AP 考试 50% 分值，完成官方题是最直接的水平校准</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── ReflectionCard ────────────────────────────────────────────────────────────

function ReflectionCard({ week, day, concepts, aResources }: {
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

// ── RelatedFRQCard ────────────────────────────────────────────────────────────

function RelatedFRQCard({ conceptIds }: { conceptIds: string[] }) {
  const related = findRelatedFRQ(conceptIds)
  const [open, setOpen] = useState(false)
  const [judgmentEntry, setJudgmentEntry] = useState<FRQEntry | null>(null)

  if (!related.length) return null

  const openQuestion = (entry: FRQEntry) => {
    window.open(`${entry.frq_pdf}#page=${entry.frq_page}`, '_blank', 'noopener,noreferrer')
  }

  const confirmAnswer = (entry: FRQEntry) => {
    window.open(`${entry.sg_pdf}#page=${entry.sg_page ?? 1}`, '_blank', 'noopener,noreferrer')
    setJudgmentEntry(null)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">
        {/* Collapsible header */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-violet-50 hover:brightness-95 transition-all text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">FRQ</span>
            <span className="text-sm font-medium text-violet-700">历年相关真题</span>
            <span className="text-xs text-stone-400">按今日知识点匹配</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">{related.length} 题</span>
            <svg
              className={`w-3.5 h-3.5 text-stone-300 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Rows */}
        {open && (
          <div className="divide-y divide-stone-50">
            {related.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-stone-400">{entry.year}</span>
                    <span className="text-xs font-semibold text-stone-700">Q{entry.question_number}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600">
                      {frqTypeLabel(entry.frq_type)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                    {entry.text_preview.slice(0, 130)}…
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openQuestion(entry)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors font-medium whitespace-nowrap"
                  >
                    查看题目 ↗
                  </button>
                  {entry.sg_pdf && (
                    <button
                      onClick={() => setJudgmentEntry(entry)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors whitespace-nowrap"
                    >
                      查看答案
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moral judgment dialog */}
      {judgmentEntry && (
        <MoralJudgmentDialog
          entry={judgmentEntry}
          onConfirm={() => confirmAnswer(judgmentEntry)}
          onCancel={() => setJudgmentEntry(null)}
        />
      )}
    </>
  )
}

// ── MoralJudgmentDialog ───────────────────────────────────────────────────────

function MoralJudgmentDialog({ entry, onConfirm, onCancel }: {
  entry: FRQEntry
  onConfirm: () => void
  onCancel: () => void
}) {
  const [checked, setChecked] = useState([false])

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, j) => (j === i ? !v : v)))

  const allChecked = checked.every(Boolean)

  const items = [
    `我已独立完成 ${entry.year} Q${entry.question_number} 的作答，没有在中途查阅提示或答案`,
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-50 px-5 pt-5 pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-lg">
              ⚖️
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">查看答案前，请认真思考</p>
              <p className="text-xs text-stone-500 mt-0.5">{entry.year} · Q{entry.question_number} · {frqTypeLabel(entry.frq_type)}</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-stone-500">逐条确认后才能查看评分标准：</p>
          {items.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`mt-0.5 w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all ${
                  checked[i]
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-stone-300 group-hover:border-amber-400'
                }`}
                onClick={() => toggle(i)}
              >
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs leading-relaxed transition-colors ${checked[i] ? 'text-stone-400 line-through' : 'text-stone-600'}`}
                onClick={() => toggle(i)}
              >
                {item}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            再想想
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              allChecked
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
          >
            已确认，查看答案
          </button>
        </div>
      </div>
    </div>
  )
}
