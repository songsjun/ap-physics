// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Resource, Completion, DaySnapshot, DailyFeedback, DayStats } from '@/lib/types'

// ── hoisted mocks ─────────────────────────────────────────────────────────────
const {
  mockAssembleDaySnapshot,
  mockTrackerRecord,
  mockTrackerUnlockDay,
  mockTrackerGetDayStats,
  mockAIGetDailyFeedback,
  mockDbCompletions,
  mockTransact,
  mockGetCompletionsByResourceIds,
  mockIsDayUnlocked,
} = vi.hoisted(() => {
  const mockDbCompletions: Completion[] = []
  const mockGetCompletionsByResourceIds = vi.fn(
    async (_userId: string, resourceIds: Set<string>) =>
      mockDbCompletions.filter(c => resourceIds.has(c.resource_id)),
  )
  const mockTransact = vi.fn(async (fn: () => Promise<void>) => { await fn() })
  return {
    mockAssembleDaySnapshot: vi.fn(),
    mockTrackerRecord: vi.fn(),
    mockTrackerUnlockDay: vi.fn(),
    mockTrackerGetDayStats: vi.fn(),
    mockAIGetDailyFeedback: vi.fn(),
    mockDbCompletions,
    mockTransact,
    mockGetCompletionsByResourceIds,
    mockIsDayUnlocked: vi.fn(),
  }
})

vi.mock('@/lib/app/snapshot', () => ({
  assembleDaySnapshot: mockAssembleDaySnapshot,
}))

vi.mock('@/lib/domain/progress', () => ({
  tracker: {
    record: mockTrackerRecord,
    unlockDay: mockTrackerUnlockDay,
    getDayStats: mockTrackerGetDayStats,
  },
}))

vi.mock('@/lib/infra/ai', () => ({
  AIService: {
    getDailyFeedback: mockAIGetDailyFeedback,
  },
}))

// repo is now the only infra dependency of session.ts — no longer needs getDb mock
vi.mock('@/lib/repository', () => ({
  repo: {
    transact: mockTransact,
    getCompletionsByResourceIds: mockGetCompletionsByResourceIds,
    isDayUnlocked: mockIsDayUnlocked,
  },
}))

// ── import SUT after mocks are wired ─────────────────────────────────────────
import { DaySessionManager } from '@/lib/app/session'

// ── fixtures ──────────────────────────────────────────────────────────────────
function makeResource(id: string, overrides: Partial<Resource> = {}): Resource {
  return {
    id,
    title: `Resource ${id}`,
    url: 'https://example.com',
    adapter_type: 'external_manual',
    type: 'video',
    platform: 'khan',
    tier: 'A',
    phase: 'LEARN',
    estimated_minutes: 10,
    concepts: ['concept-1'],
    week: 1,
    day: 1,
    slot_order: 1,
    ...overrides,
  }
}

function makeCompletion(
  resourceId: string,
  status: 'passed' | 'failed' | 'skipped',
  userId = 'user1',
): Completion {
  return {
    user_id: userId,
    resource_id: resourceId,
    status,
    completed_at: new Date().toISOString(),
  }
}

function makeSnapshot(overrides: Partial<DaySnapshot> = {}): DaySnapshot {
  return {
    isUnlocked: true,
    mode: 'STANDARD',
    aResources: [],
    completions: new Map(),
    bCandidates: [],
    bTotalForSession: 0,
    ...overrides,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe('DaySessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // reset the shared mutable array between tests
    mockDbCompletions.length = 0
    // Re-wire after clearAllMocks resets implementations
    mockTransact.mockImplementation(async (fn: () => Promise<void>) => { await fn() })
    mockGetCompletionsByResourceIds.mockImplementation(
      async (_userId: string, resourceIds: Set<string>) =>
        mockDbCompletions.filter(c => resourceIds.has(c.resource_id)),
    )
    // sensible defaults that don't conflict
    mockTrackerRecord.mockImplementation(async (_userId: string, resourceId: string, result: { status: string }) => {
      mockDbCompletions.push(makeCompletion(resourceId, result.status as 'passed' | 'failed' | 'skipped'))
    })
    mockTrackerUnlockDay.mockResolvedValue(undefined)
    // Default: next day not yet unlocked — allows unlock path to proceed
    mockIsDayUnlocked.mockResolvedValue(false)
  })

  // ── Test 1 ────────────────────────────────────────────────────────────────
  it('load() returns FlowState from assembleDaySnapshot', async () => {
    const r1 = makeResource('r1')
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
    })
    mockAssembleDaySnapshot.mockResolvedValue(snapshot)

    const manager = new DaySessionManager()
    const flowState = await manager.load('user1', 1, 1)

    expect(mockAssembleDaySnapshot).toHaveBeenCalledWith('user1', 1, 1)
    expect(flowState.phase).toBe('PRESENTING')
  })

  // ── Test 2 ────────────────────────────────────────────────────────────────
  it('load() auto-unlocks next day for rest day (aResources=[])', async () => {
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [],
      completions: new Map(),
    })
    mockAssembleDaySnapshot.mockResolvedValue(snapshot)

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)

    expect(mockTrackerUnlockDay).toHaveBeenCalledWith('user1', 1, 2)
  })

  // ── Test 3 ────────────────────────────────────────────────────────────────
  it('load() does NOT auto-unlock if day has A resources', async () => {
    const r1 = makeResource('r1')
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
    })
    mockAssembleDaySnapshot.mockResolvedValue(snapshot)

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)

    expect(mockTrackerUnlockDay).not.toHaveBeenCalled()
  })

  // ── Test 4 ────────────────────────────────────────────────────────────────
  it('execute(COMPLETE_RESOURCE) calls tracker.record with the result', async () => {
    const r1 = makeResource('r1')
    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
    })
    // snapshot returned after execute re-assembles
    const postSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'passed')]]),
    })
    mockAssembleDaySnapshot.mockResolvedValueOnce(loadSnapshot).mockResolvedValue(postSnapshot)

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    await manager.execute({
      type: 'COMPLETE_RESOURCE',
      resourceId: 'r1',
      result: { status: 'passed', score: 3, score_max: 4 },
    })

    expect(mockTrackerRecord).toHaveBeenCalledWith('user1', 'r1', {
      status: 'passed',
      score: 3,
      score_max: 4,
    })
  })

  // ── Test 5 ────────────────────────────────────────────────────────────────
  it('execute(SKIP_RESOURCE) calls tracker.record with { status: "skipped" }', async () => {
    const r1 = makeResource('r1')
    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
    })
    const postSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'skipped')]]),
    })
    mockAssembleDaySnapshot.mockResolvedValueOnce(loadSnapshot).mockResolvedValue(postSnapshot)

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    await manager.execute({ type: 'SKIP_RESOURCE', resourceId: 'r1' })

    expect(mockTrackerRecord).toHaveBeenCalledWith('user1', 'r1', { status: 'skipped' })
  })

  // ── Test 6 ────────────────────────────────────────────────────────────────
  it('execute() unlocks next day when passRate >= 0.75 (3 passed, 1 failed)', async () => {
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    const r3 = makeResource('r3')
    const r4 = makeResource('r4')
    const aResources = [r1, r2, r3, r4]

    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources,
      completions: new Map(),
    })
    const postSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources,
      completions: new Map([
        ['r1', makeCompletion('r1', 'passed')],
        ['r2', makeCompletion('r2', 'passed')],
        ['r3', makeCompletion('r3', 'passed')],
        ['r4', makeCompletion('r4', 'failed')],
      ]),
    })
    mockAssembleDaySnapshot.mockResolvedValueOnce(loadSnapshot).mockResolvedValue(postSnapshot)

    // DB pre-populates completions from prior execute() calls; r4 is written by mockTrackerRecord
    mockDbCompletions.push(
      makeCompletion('r1', 'passed'),
      makeCompletion('r2', 'passed'),
      makeCompletion('r3', 'passed'),
    )

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    await manager.execute({
      type: 'COMPLETE_RESOURCE',
      resourceId: 'r4',
      result: { status: 'failed' },
    })

    expect(mockTrackerUnlockDay).toHaveBeenCalledWith('user1', 1, 2)
  })

  // ── Test 7 ────────────────────────────────────────────────────────────────
  it('execute() does NOT unlock when passRate < 0.75 (1 passed, 3 failed)', async () => {
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    const r3 = makeResource('r3')
    const r4 = makeResource('r4')
    const aResources = [r1, r2, r3, r4]

    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources,
      completions: new Map(),
    })
    const b1 = makeResource('b1', { tier: 'B' })
    const postSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources,
      completions: new Map([
        ['r1', makeCompletion('r1', 'passed')],
        ['r2', makeCompletion('r2', 'failed')],
        ['r3', makeCompletion('r3', 'failed')],
        ['r4', makeCompletion('r4', 'failed')],
      ]),
      bCandidates: [b1],
      bTotalForSession: 1,
    })
    mockAssembleDaySnapshot.mockResolvedValueOnce(loadSnapshot).mockResolvedValue(postSnapshot)

    // DB pre-populates completions from prior execute() calls; r4 is written by mockTrackerRecord
    mockDbCompletions.push(
      makeCompletion('r1', 'passed'),
      makeCompletion('r2', 'failed'),
      makeCompletion('r3', 'failed'),
    )

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    await manager.execute({
      type: 'COMPLETE_RESOURCE',
      resourceId: 'r4',
      result: { status: 'failed' },
    })

    expect(mockTrackerUnlockDay).not.toHaveBeenCalled()
  })

  // ── Test 8 ────────────────────────────────────────────────────────────────
  it('bTotalForSession freezes once REMEDIATION starts', async () => {
    const r1 = makeResource('r1')
    const b1 = makeResource('b1', { tier: 'B' })
    const b2 = makeResource('b2', { tier: 'B' })
    const b3 = makeResource('b3', { tier: 'B' })

    // Step 1: load() — PRESENTING phase
    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
      bCandidates: [b1, b2, b3],
      bTotalForSession: 3,
    })

    // Step 2: first execute(r1 failed) — snapshot after re-assemble → transitions to REMEDIATION
    // All 3 B candidates still present, bTotalForSession in snapshot = 3
    const afterR1Snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'failed')]]),
      bCandidates: [b1, b2, b3],
      bTotalForSession: 3,
    })

    // Step 3: second execute(b1 passed) — snapshot after re-assemble → b1 consumed, 2 remain
    // bCandidates shrinks to [b2, b3], but bTotalForSession in snapshot is recalculated from
    // bCandidates.length which would be 2 — however DaySessionManager must FREEZE it at 3
    const afterB1Snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([
        ['r1', makeCompletion('r1', 'failed')],
        ['b1', makeCompletion('b1', 'passed')],
      ]),
      bCandidates: [b2, b3],
      bTotalForSession: 2, // raw value from snapshot — should be overridden by frozen value
    })

    mockAssembleDaySnapshot
      .mockResolvedValueOnce(loadSnapshot)   // load()
      .mockResolvedValueOnce(afterR1Snapshot) // first execute()
      .mockResolvedValueOnce(afterB1Snapshot) // second execute()

    const manager = new DaySessionManager()

    // Step 1: load
    const state1 = await manager.load('user1', 1, 1)
    expect(state1.phase).toBe('PRESENTING')

    // Step 2: complete r1 as failed → should enter REMEDIATION with total=3
    const state2 = await manager.execute({
      type: 'COMPLETE_RESOURCE',
      resourceId: 'r1',
      result: { status: 'failed' },
    })
    expect(state2.phase).toBe('REMEDIATION')
    if (state2.phase === 'REMEDIATION') {
      expect(state2.total).toBe(3)
      expect(state2.slot).toBe(1) // 0 consumed → presenting B resource #1
    }

    // Step 3: complete b1 as passed → REMEDIATION slot should advance; total must stay 3
    const state3 = await manager.execute({
      type: 'COMPLETE_RESOURCE',
      resourceId: 'b1',
      result: { status: 'passed' },
    })
    expect(state3.phase).toBe('REMEDIATION')
    if (state3.phase === 'REMEDIATION') {
      expect(state3.slot).toBe(2) // 1 consumed → presenting B resource #2
      expect(state3.total).toBe(3) // frozen, not 2
    }
  })

  // ── Test 9 ────────────────────────────────────────────────────────────────
  it('forceAdvance() unlocks next day and returns COMPLETE phase', async () => {
    const r1 = makeResource('r1')
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'failed')]]),
      bCandidates: [],
    })
    const afterAdvanceSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'failed')]]),
    })
    mockAssembleDaySnapshot
      .mockResolvedValueOnce(snapshot)             // load()
      .mockResolvedValueOnce(afterAdvanceSnapshot) // forceAdvance()

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 3)
    const state = await manager.forceAdvance()

    expect(mockTrackerUnlockDay).toHaveBeenCalledWith('user1', 1, 4)
    // forceAdvance signals in-session COMPLETE so the UI transitions away from NEEDS_RETRY
    expect(state.phase).toBe('COMPLETE')
  })

  // ── Test 10 ───────────────────────────────────────────────────────────────
  it('forceAdvance() at final day returns current state without calling unlockDay', async () => {
    const r1 = makeResource('r1')
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map(),
    })
    mockAssembleDaySnapshot.mockResolvedValue(snapshot)

    const manager = new DaySessionManager()
    const loadState = await manager.load('user1', 8, 7)
    const advanceState = await manager.forceAdvance()

    // No unlock should happen at the terminus
    expect(mockTrackerUnlockDay).not.toHaveBeenCalled()
    // State is unchanged
    expect(advanceState.phase).toBe(loadState.phase)
  })

  // ── Test 11 ───────────────────────────────────────────────────────────────
  it('forceAdvance() returns COMPLETE even when mid-REMEDIATION (in-session signal)', async () => {
    const r1 = makeResource('r1')
    const b1 = makeResource('b1', { tier: 'B' })
    const b2 = makeResource('b2', { tier: 'B' })

    const remediationSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'failed')]]),
      bCandidates: [b1, b2],
      bTotalForSession: 2,
    })
    const afterAdvanceSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'failed')]]),
      bCandidates: [b2],
      bTotalForSession: 1,
    })
    mockAssembleDaySnapshot
      .mockResolvedValueOnce(remediationSnapshot) // load()
      .mockResolvedValueOnce(afterAdvanceSnapshot) // forceAdvance()

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    const state = await manager.forceAdvance()

    expect(mockTrackerUnlockDay).toHaveBeenCalledWith('user1', 1, 2)
    expect(state.phase).toBe('COMPLETE')
  })

  // ── Test 11b ──────────────────────────────────────────────────────────────
  it('execute() does NOT unlock when a resource is skipped (skip gaming prevention)', async () => {
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    const r3 = makeResource('r3')
    const r4 = makeResource('r4')
    const aResources = [r1, r2, r3, r4]

    const loadSnapshot = makeSnapshot({ isUnlocked: true, aResources, completions: new Map() })
    const postSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources,
      completions: new Map([
        ['r1', makeCompletion('r1', 'passed')],
        ['r2', makeCompletion('r2', 'passed')],
        ['r3', makeCompletion('r3', 'passed')],
        ['r4', makeCompletion('r4', 'skipped')],
      ]),
    })
    mockAssembleDaySnapshot.mockResolvedValueOnce(loadSnapshot).mockResolvedValue(postSnapshot)

    // Pre-populate DB completions (r1-r3 passed already)
    mockDbCompletions.push(
      makeCompletion('r1', 'passed'),
      makeCompletion('r2', 'passed'),
      makeCompletion('r3', 'passed'),
    )

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    // r4 is skipped — should NOT unlock next day even though pass rate (3/3=100%) is above threshold
    await manager.execute({ type: 'SKIP_RESOURCE', resourceId: 'r4' })

    expect(mockTrackerUnlockDay).not.toHaveBeenCalled()
  })

  // ── Test 12 ───────────────────────────────────────────────────────────────
  it('requestFeedback() calls getDayStats and AIService.getDailyFeedback', async () => {
    const r1 = makeResource('r1')
    const snapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1],
      completions: new Map([['r1', makeCompletion('r1', 'passed')]]),
    })
    mockAssembleDaySnapshot.mockResolvedValue(snapshot)

    const fakeStats: DayStats = {
      passRate: 0.8,
      passedCount: 4,
      failedCount: 1,
      gradedCount: 5,
      totalACount: 5,
      weakConcepts: [],
      seenResourceIds: new Set(),
    }
    const fakeFeedback: DailyFeedback = {
      strength: 'good',
      note: null as unknown as string,
      preview: null as unknown as string,
    }
    mockTrackerGetDayStats.mockResolvedValue(fakeStats)
    mockAIGetDailyFeedback.mockResolvedValue(fakeFeedback)

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)
    const feedback = await manager.requestFeedback()

    expect(mockTrackerGetDayStats).toHaveBeenCalledWith('user1', 1, 1, [r1])
    expect(mockAIGetDailyFeedback).toHaveBeenCalledWith(fakeStats, { week: 1, day: 1 }, undefined)
    expect(feedback).toEqual(fakeFeedback)
  })

  // ── Test 13 ───────────────────────────────────────────────────────────────
  it('execute(RESET_FAILED_RESOURCES) re-records failed A resources as skipped and returns PRESENTING', async () => {
    const r1 = makeResource('r1')
    const r2 = makeResource('r2')
    const r3 = makeResource('r3')

    // Load snapshot: r1+r2 passed, r3 failed → NEEDS_RETRY (passRate=2/3 < 0.75, no B candidates)
    const loadSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1, r2, r3],
      completions: new Map([
        ['r1', makeCompletion('r1', 'passed')],
        ['r2', makeCompletion('r2', 'passed')],
        ['r3', makeCompletion('r3', 'failed')],
      ]),
      bCandidates: [],
    })
    // Post-reset snapshot: r3 is now skipped → incomplete → PRESENTING
    const postResetSnapshot = makeSnapshot({
      isUnlocked: true,
      aResources: [r1, r2, r3],
      completions: new Map([
        ['r1', makeCompletion('r1', 'passed')],
        ['r2', makeCompletion('r2', 'passed')],
        ['r3', makeCompletion('r3', 'skipped')],
      ]),
      bCandidates: [],
    })
    mockAssembleDaySnapshot
      .mockResolvedValueOnce(loadSnapshot)   // load()
      .mockResolvedValueOnce(postResetSnapshot)  // execute() re-assembly

    const manager = new DaySessionManager()
    await manager.load('user1', 1, 1)

    // Verify pre-condition: day is in NEEDS_RETRY
    // (loadSnapshot has all A done, passRate < threshold, no B candidates)

    const nextState = await manager.execute({ type: 'RESET_FAILED_RESOURCES' })

    // Failed resource r3 should be re-recorded as skipped
    expect(mockTrackerRecord).toHaveBeenCalledWith('user1', 'r3', { status: 'skipped' })
    // r1 and r2 (passed) must NOT be touched
    expect(mockTrackerRecord).not.toHaveBeenCalledWith('user1', 'r1', expect.anything())
    expect(mockTrackerRecord).not.toHaveBeenCalledWith('user1', 'r2', expect.anything())
    // Flow should return to PRESENTING with r3 as the incomplete resource
    expect(nextState.phase).toBe('PRESENTING')
  })

  // ── Test 14 ───────────────────────────────────────────────────────────────
  it('BADGE_AMBER: gate-pass score of 49 must be ≥ BADGE_AMBER to avoid red badge', async () => {
    // A student who completes all 4 A resources and passes exactly 3/4 (75%) earns:
    // aScore = 30*(4/4) + 25*(3/4) = 30 + 18.75 = 48.75 → rounded to 49.
    // This must be ≥ BADGE_AMBER so the dashboard badge shows amber, not red.
    const { BADGE_AMBER } = await import('@/lib/constants')
    const gatePassScore = 49
    expect(gatePassScore).toBeGreaterThanOrEqual(BADGE_AMBER)
  })
})
