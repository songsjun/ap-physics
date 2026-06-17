'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDayContext } from '@/lib/app/session-context'
import { useDayResources } from '@/lib/app/useDayResources'
import type { Resource, KnowledgePoint, DailyFeedback } from '@/lib/types'
import { TierSection, RowSharedProps } from './ResourceRow'
import { RelatedFRQCard } from './RelatedFRQCard'
import { PASS_THRESHOLD, QUIZ_ESTIMATED_MINUTES } from '@/lib/constants'
import { ChallengePrompt } from './ChallengePrompt'
import { QuizPanel } from './QuizPanel'
import { DaySkeleton } from '@/components/DaySkeleton'

// ── CompleteBanner ────────────────────────────────────────────────────────────

function CompleteBanner({ passRate, feedback }: { passRate: number | null; feedback: DailyFeedback | null }) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">Day Complete</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {passRate !== null ? `Pass rate ${Math.round(passRate * 100)}%  ·  ` : 'Gate skipped  ·  '}
            Next day unlocked
          </p>
        </div>
      </div>
      {feedback ? (
        <div className="space-y-1.5 text-sm border-t border-emerald-200 dark:border-emerald-800 pt-3 pl-1">
          <p className="text-stone-700 dark:text-stone-300">💪 {feedback.strength}</p>
          {feedback.note && <p className="text-stone-600 dark:text-stone-400">📝 {feedback.note}</p>}
          {feedback.preview && <p className="text-stone-500 dark:text-stone-400">👀 Tomorrow: {feedback.preview}</p>}
        </div>
      ) : (
        <p className="text-xs text-emerald-500 pl-1 animate-pulse">Fetching AI feedback…</p>
      )}
    </div>
  )
}

// ── NeedsRetryBanner ─────────────────────────────────────────────────────────

function NeedsRetryBanner({
  passRate,
  retryCount,
  weakConceptNames,
  onForceAdvance,
  onResetFailed,
}: {
  passRate: number | null
  retryCount: number
  weakConceptNames: string[]
  onForceAdvance: () => void
  onResetFailed: () => void
}) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-orange-900 text-sm">Needs Retry</p>
          <p className="text-xs text-orange-600">
            Current pass rate {passRate !== null ? Math.round(passRate * 100) : 0}%  ·  Target 75%
          </p>
        </div>
      </div>
      {weakConceptNames.length > 0 ? (
        <p className="text-xs text-orange-700 pl-1">
          You struggled with the following topics. Please redo related resources (those marked ✕):
          <span className="font-medium"> {weakConceptNames.join(', ')}</span>
        </p>
      ) : (
        <p className="text-xs text-orange-700 pl-1">
          Please redo the Tier A resources below to improve your pass rate and unlock the next day.
        </p>
      )}
      <button
        onClick={onResetFailed}
        className="mt-1 w-full py-2.5 px-3 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors min-h-[44px]"
      >
        Redo Failed Items
      </button>
      {retryCount >= 2 && (
        <button
          onClick={onForceAdvance}
          className="py-2 px-1 text-sm text-stone-500 underline min-h-[44px]"
        >
          Continue anyway (skip this gate, not counted as passed)
        </button>
      )}
    </div>
  )
}

// ── DayListView ───────────────────────────────────────────────────────────────

export function DayListView({ week, day }: { week: number; day: number }) {
  const { userId, dispatch, flowState, feedback } = useDayContext()
  const {
    resources,
    completions,
    kpMap,
    loading,
    challengeStatus,
    challengeResults,
    availableQuestions,
    quizChecked,
    setChallengeStatus,
    onChallengeComplete,
  } = useDayResources(userId, week, day, flowState)

  // id of resource currently in score-input mode
  const [scoringId, setScoringId] = useState<string | null>(null)
  const feedbackRequestedRef = useRef(false)
  const retryPhaseKeyRef = useRef<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Reset per-day state when navigating to a different day (same component instance via client routing)
  useEffect(() => {
    feedbackRequestedRef.current = false
  }, [week, day])

  // Also re-arm feedback when the phase leaves COMPLETE (e.g. after
  // RESET_FAILED_RESOURCES). Without this, the ref stays true and
  // REQUEST_FEEDBACK never fires on the subsequent completion.
  useEffect(() => {
    if (flowState.phase !== 'COMPLETE') {
      feedbackRequestedRef.current = false
    }
  }, [flowState.phase])

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
    const key = `${week}:${day}`
    if (flowState.phase === 'NEEDS_RETRY') {
      if (retryPhaseKeyRef.current !== key) {
        retryPhaseKeyRef.current = key
        setRetryCount(count => count + 1)
      }
    } else {
      retryPhaseKeyRef.current = null
      setRetryCount(0)
    }
  }, [week, day, flowState.phase])

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

  // All hooks must be called before any early return
  const aTier = resources.filter(r => r.tier === 'A')
  const aConceptIds = useMemo(
    () => [...new Set(aTier.flatMap(r => r.concepts))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resources],
  )
  const handleQuizExit = useCallback(() => setChallengeStatus('skipped'), [setChallengeStatus])

  if (loading) {
    return <DaySkeleton />
  }

  if (flowState.phase === 'LOCKED') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <p className="text-stone-500 dark:text-stone-400 text-sm">Complete the previous day&apos;s required tasks to unlock.</p>
      </div>
    )
  }
  const bTier = resources.filter(r => r.tier === 'B')

  const aPassed = aTier.filter(r => completions.get(r.id)?.status === 'passed').length
  // Use aTotal denominator — matches calcAttemptedPassRate used by the gate.
  // aPassed/aGraded would diverge after RESET_FAILED_RESOURCES (failed→skipped
  // drops aGraded), making the banner show 100% while the gate stays blocked.
  const passRate = aTier.length > 0 ? aPassed / aTier.length : null
  const aTotalMin = aTier.reduce((s, r) => s + r.estimated_minutes, 0)
  const hasAFailed = aTier.some(r => completions.get(r.id)?.status === 'failed')

  // Weak concepts: A-tier resources the student failed
  const weakConceptIds = new Set(
    aTier
      .filter(r => completions.get(r.id)?.status === 'failed')
      .flatMap(r => r.concepts)
  )

  // C-tier sorted by weakness: resources covering failed concepts come first
  const cTier = resources
    .filter(r => r.tier === 'C')
    .sort((a, b) => {
      const aCoversWeak = a.concepts.some(c => weakConceptIds.has(c)) ? 0 : 1
      const bCoversWeak = b.concepts.some(c => weakConceptIds.has(c)) ? 0 : 1
      return aCoversWeak - bCoversWeak || a.slot_order - b.slot_order
    })

  const aConcepts = aConceptIds
    .map(id => kpMap.get(id))
    .filter(Boolean) as KnowledgePoint[]

  const rowProps: RowSharedProps = { completions, kpMap, scoringId, onCheckDirect: handleCheckDirect, onCheckGraded: handleCheckGraded, onScoreSubmit: handleScoreSubmit, onScoreCancel: handleScoreCancel }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

      {/* Complete banner */}
      {flowState.phase === 'COMPLETE' && (
        <CompleteBanner passRate={flowState.passRate} feedback={feedback} />
      )}

      {/* Needs-retry banner */}
      {flowState.phase === 'NEEDS_RETRY' && (
        <NeedsRetryBanner
          passRate={passRate}
          retryCount={retryCount}
          weakConceptNames={
            [...weakConceptIds]
              .map(id => kpMap.get(id)?.name_en)
              .filter((n): n is string => Boolean(n))
          }
          onForceAdvance={() => dispatch({ type: 'FORCE_ADVANCE' })}
          onResetFailed={() => dispatch({ type: 'RESET_FAILED_RESOURCES' })}
        />
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
          userId={userId}
          week={week}
          day={day}
          conceptIds={aConceptIds}
          onComplete={onChallengeComplete}
          onExit={handleQuizExit}
        />
      )}

      {flowState.phase === 'COMPLETE' && challengeStatus === 'done' && challengeResults.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-500">
            ⚡ Today&apos;s Challenge: {challengeResults.filter(r => r.correct).length} / {challengeResults.length} correct
          </p>
        </div>
      )}

      {flowState.phase === 'COMPLETE' && challengeStatus === 'prompt' && quizChecked && availableQuestions === 0 && (
        <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
          <p className="text-xs text-stone-400">⚡ All related questions completed. Keep studying new content to unlock more.</p>
        </div>
      )}

      {/* A 必做 */}
      {aTier.length > 0 ? (
        <TierSection
          tier="A"
          label="Required"
          accentCls="text-blue-700 dark:text-blue-300"
          headerBg="bg-blue-50 dark:bg-blue-900/20"
          borderCls="border-blue-100 dark:border-blue-900"
          description={`~${aTotalMin} min · then ~${QUIZ_ESTIMATED_MINUTES} min challenge`}
          statusText={`${aPassed}/${aTier.length} done${passRate !== null ? `  ·  ${Math.round(passRate * 100)}%` : ''}`}
          resources={aTier}
          defaultOpen
          {...rowProps}
        />
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Free Study Day</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">No required tasks. Next day auto-unlocked.</p>
          </div>
        </div>
      )}

      {/* B 建议 */}
      {bTier.length > 0 && (
        <TierSection
          tier="B"
          label="Supplemental"
          accentCls="text-amber-700 dark:text-amber-300"
          headerBg="bg-amber-50 dark:bg-amber-900/20"
          borderCls="border-amber-100 dark:border-amber-900"
          description={hasAFailed ? 'Some items failed — expanded for targeted practice' : 'Use when Tier A < 75% or stuck on a concept'}
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
          label="Extension"
          accentCls="text-stone-500 dark:text-stone-400"
          headerBg="bg-stone-50 dark:bg-stone-700"
          borderCls="border-stone-100 dark:border-stone-700"
          description="100% coverage / second pass"
          statusText=""
          resources={cTier}
          defaultOpen={false}
          {...rowProps}
        />
      )}

      {/* 相关 FRQ 真题 */}
      {aConcepts.length > 0 && (
        <RelatedFRQCard userId={userId} conceptIds={aConcepts.map(k => k.id)} week={week} day={day} />
      )}
    </div>
  )
}
