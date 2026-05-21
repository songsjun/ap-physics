'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useDayContext } from '@/lib/app/session-context'
import { repo } from '@/lib/repository'
import { StorageService } from '@/lib/infra/storage'
import type { Resource, Completion, KnowledgePoint, DailyFeedback, QuizResult } from '@/lib/types'
import { TierSection, RowSharedProps } from './ResourceRow'
import { RelatedFRQCard } from './RelatedFRQCard'
import { PASS_THRESHOLD } from '@/lib/constants'
import { ChallengePrompt } from './ChallengePrompt'
import { QuizPanel } from './QuizPanel'
import { selectDailyQuestions } from '@/lib/app/quiz'

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

// ── DayListView ───────────────────────────────────────────────────────────────

type ChallengeStatus = 'prompt' | 'active' | 'done' | 'skipped'

export function DayListView({ week, day }: { week: number; day: number }) {
  const { dispatch, flowState, feedback } = useDayContext()
  const [resources, setResources] = useState<Resource[]>([])
  const [completions, setCompletions] = useState<Map<string, Completion>>(new Map())
  const [kpMap, setKpMap] = useState<Map<string, KnowledgePoint>>(new Map())
  const [loading, setLoading] = useState(true)
  // id of resource currently in score-input mode
  const [scoringId, setScoringId] = useState<string | null>(null)
  const feedbackRequestedRef = useRef(false)

  // Challenge state
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('prompt')
  const [availableQuestions, setAvailableQuestions] = useState(0)
  const [challengeResults, setChallengeResults] = useState<QuizResult[]>([])

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
      const allRes = await repo.getAllDayResources(week, day)
      if (cancelled) return
      const conceptIds = [...new Set(allRes.flatMap(r => r.concepts))]
      const kps = await repo.getKnowledgePoints(conceptIds)
      if (cancelled) return
      const newKpMap = new Map<string, KnowledgePoint>()
      kps.forEach(kp => { newKpMap.set(kp.id, kp) })
      setResources(allRes)
      setKpMap(newKpMap)
      setLoading(false)

      // Check challenge status
      const existingResults = await repo.getQuizResultsForDay(userId, week, day)
      if (cancelled) return
      if (existingResults.length > 0) {
        setChallengeStatus('done')
        setChallengeResults(existingResults)
      } else {
        const questions = await selectDailyQuestions(userId, week, day, conceptIds, 4)
        if (!cancelled) setAvailableQuestions(questions.length)
      }
    }
    load().catch(console.error)
    return () => { cancelled = true }
  }, [week, day])

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const userId = StorageService.userId.get()
      if (!userId) return
      const dayCompletions = await repo.getCompletions(userId, week, day)
      if (cancelled) return
      setCompletions(new Map(dayCompletions.map(c => [c.resource_id, c])))
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

  const rowProps: RowSharedProps = { completions, kpMap, scoringId, onCheckDirect: handleCheckDirect, onCheckGraded: handleCheckGraded, onScoreSubmit: handleScoreSubmit, onScoreCancel: handleScoreCancel }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

      {/* Complete banner */}
      {flowState.phase === 'COMPLETE' && (
        <CompleteBanner passRate={flowState.passRate} feedback={feedback} />
      )}

      {/* Challenge system */}
      {flowState.phase === 'COMPLETE' && challengeStatus === 'prompt' && availableQuestions > 0 && (
        <ChallengePrompt
          week={week}
          day={day}
          questionCount={availableQuestions}
          onStart={() => setChallengeStatus('active')}
          onSkip={() => setChallengeStatus('skipped')}
        />
      )}

      {flowState.phase === 'COMPLETE' && challengeStatus === 'active' && (
        <QuizPanel
          week={week}
          day={day}
          conceptIds={[...new Set(aTier.flatMap(r => r.concepts))]}
          onComplete={(results) => {
            setChallengeResults(results)
            setChallengeStatus('done')
          }}
          onExit={() => setChallengeStatus('skipped')}
        />
      )}

      {flowState.phase === 'COMPLETE' && challengeStatus === 'done' && challengeResults.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500">
            ⚡ 今日挑战：{challengeResults.filter(r => r.correct).length} / {challengeResults.length} 正确
          </p>
        </div>
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
    </div>
  )
}
