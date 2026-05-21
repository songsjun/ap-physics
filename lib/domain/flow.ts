import { PASS_THRESHOLD } from '@/lib/constants'
import type { DaySnapshot, FlowState, DayStats, DayMode } from '@/lib/types'

export function computeFlowState(snapshot: DaySnapshot): FlowState {
  // Rule 1: not unlocked → LOCKED
  if (!snapshot.isUnlocked) return { phase: 'LOCKED' }

  // Rule 1b: no A-tier resources (rest/review day) → auto-complete
  if (snapshot.aResources.length === 0) {
    return { phase: 'COMPLETE', passRate: 1 }
  }

  // Rule 2: find first incomplete A resource (not_started or skipped)
  const incomplete = snapshot.aResources.find(r => {
    const c = snapshot.completions.get(r.id)
    return !c || c.status === 'skipped'
  })
  if (incomplete) {
    // doneCount = number of A resources with passed or failed status
    const doneCount = snapshot.aResources.filter(r => {
      const c = snapshot.completions.get(r.id)
      return c && c.status !== 'skipped'
    }).length
    return {
      phase: 'PRESENTING',
      resource: incomplete,
      slot: doneCount + 1,
      total: snapshot.aResources.length,
    }
  }

  // All A resources are done (passed/failed — none is incomplete)

  // Rule 3: REVIEW mode → COMPLETE without passRate check
  if (snapshot.mode === 'REVIEW') return { phase: 'COMPLETE', passRate: calcPassRate(snapshot) }

  const passRate = calcPassRate(snapshot)

  // Rule 4: passRate ≥ threshold → COMPLETE
  if (passRate >= PASS_THRESHOLD) return { phase: 'COMPLETE', passRate }

  // Rule 5: B candidates available → REMEDIATION
  if (snapshot.bCandidates.length > 0) {
    return {
      phase: 'REMEDIATION',
      resources: snapshot.bCandidates,
      slot: snapshot.bTotalForSession - snapshot.bCandidates.length,
      total: snapshot.bTotalForSession,
    }
  }

  // Rule 6: B exhausted, still below threshold → NEEDS_RETRY
  return { phase: 'NEEDS_RETRY' }
}

function calcPassRate(snapshot: DaySnapshot): number {
  let passed = 0, failed = 0
  for (const r of snapshot.aResources) {
    const c = snapshot.completions.get(r.id)
    if (c?.status === 'passed') passed++
    else if (c?.status === 'failed') failed++
  }
  const graded = passed + failed
  return graded === 0 ? 0 : passed / graded
}

export function shouldUnlock(stats: DayStats, mode: DayMode): boolean {
  // In REVIEW mode, unlock regardless of pass rate (any completion suffices)
  if (mode === 'REVIEW') return true
  return stats.passRate >= PASS_THRESHOLD
}
