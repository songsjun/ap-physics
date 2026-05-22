// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Completion, QuizResult } from '@/lib/types'
import type { DayUnlock } from '@/lib/infra/db'

// ── hoisted mocks ─────────────────────────────────────────────────────────────
const {
  mockCompletions,
  mockUnlocks,
  mockQuizResults,
} = vi.hoisted(() => ({
  mockCompletions: [] as Completion[],
  mockUnlocks: [] as DayUnlock[],
  mockQuizResults: [] as QuizResult[],
}))

vi.mock('@/lib/infra/db', () => ({
  getDb: () => ({
    transaction: async (
      _mode: string,
      _t1: unknown,
      _t2: unknown,
      _t3: unknown,
      callback: () => Promise<void>,
    ) => { await callback() },
    completions: {
      where: (_f: string) => ({ equals: (_v: string) => ({
        toArray: async () => mockCompletions,
        delete: async () => { mockCompletions.length = 0 },
      })}),
      bulkPut: async (rows: Completion[]) => { mockCompletions.push(...rows) },
    },
    day_unlocks: {
      where: (_f: string) => ({ equals: (_v: string) => ({
        toArray: async () => mockUnlocks,
        delete: async () => { mockUnlocks.length = 0 },
      })}),
      bulkPut: async (rows: DayUnlock[]) => { mockUnlocks.push(...rows) },
    },
    quiz_results: {
      where: (_f: string) => ({ equals: (_v: string) => ({
        toArray: async () => mockQuizResults,
        delete: async () => { mockQuizResults.length = 0 },
      })}),
      bulkPut: async (rows: QuizResult[]) => { mockQuizResults.push(...rows) },
    },
  }),
}))

import { importProgress } from '@/lib/app/share'
import type { ExportData } from '@/lib/app/share'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeExportData(overrides: Partial<ExportData> = {}): ExportData {
  return {
    version: 2,
    exportedAt: '2026-01-01T00:00:00.000Z',
    userId: 'original-user',
    completions: [],
    dayUnlocks: [],
    ...overrides,
  }
}

function makeCompletion(overrides: Partial<Completion> = {}): Completion {
  return {
    user_id: 'original-user',
    resource_id: 'res-1',
    status: 'passed',
    completed_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeUnlock(overrides: Partial<DayUnlock> = {}): DayUnlock {
  return {
    user_id: 'original-user',
    week: 1,
    day: 1,
    unlocked_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeQuizResult(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    id: 'original-user-q1-2026-01-01T00:00:00.000Z',
    user_id: 'original-user',
    question_id: 'q1',
    concept_ids: ['concept-1'],
    week: 1,
    day: 1,
    correct: true,
    student_answer: 'A',
    answered_at: '2026-01-01T00:00:00.000Z',
    question_type: 'mcq',
    ...overrides,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe('importProgress', () => {
  beforeEach(() => {
    mockCompletions.length = 0
    mockUnlocks.length = 0
    mockQuizResults.length = 0
  })

  it('rejects unsupported version', async () => {
    // @ts-expect-error intentionally invalid version
    await expect(importProgress('u1', makeExportData({ version: 3 }))).rejects.toThrow('不支持的数据版本')
  })

  it('silently drops completions with invalid status', async () => {
    const data = makeExportData({
      completions: [
        makeCompletion({ status: 'passed' }),
        // @ts-expect-error intentionally invalid
        makeCompletion({ status: 'cheated' }),
      ],
    })
    await importProgress('new-user', data)
    expect(mockCompletions).toHaveLength(1)
    expect(mockCompletions[0].status).toBe('passed')
  })

  it('silently drops dayUnlocks with week out of range', async () => {
    const data = makeExportData({
      dayUnlocks: [
        makeUnlock({ week: 1, day: 1 }),   // valid
        makeUnlock({ week: 0, day: 1 }),   // week too low
        makeUnlock({ week: 9, day: 1 }),   // week too high
      ],
    })
    await importProgress('new-user', data)
    expect(mockUnlocks).toHaveLength(1)
    expect(mockUnlocks[0].week).toBe(1)
  })

  it('silently drops dayUnlocks with day out of range', async () => {
    const data = makeExportData({
      dayUnlocks: [
        makeUnlock({ week: 1, day: 1 }),   // valid
        makeUnlock({ week: 1, day: 0 }),   // day too low
        makeUnlock({ week: 1, day: 8 }),   // day too high
      ],
    })
    await importProgress('new-user', data)
    expect(mockUnlocks).toHaveLength(1)
    expect(mockUnlocks[0].day).toBe(1)
  })

  it('accepts version 1 export (no quiz_results field)', async () => {
    const data: ExportData = {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      userId: 'original-user',
      completions: [makeCompletion()],
      dayUnlocks: [makeUnlock()],
      // quiz_results intentionally absent
    }
    await expect(importProgress('new-user', data)).resolves.toBeUndefined()
    expect(mockCompletions).toHaveLength(1)
    expect(mockQuizResults).toHaveLength(0)
  })

  it('re-stamps user_id on all imported completions', async () => {
    const data = makeExportData({
      completions: [makeCompletion({ user_id: 'original-user' })],
    })
    await importProgress('new-user', data)
    expect(mockCompletions[0].user_id).toBe('new-user')
  })

  it('re-stamps user_id on all imported dayUnlocks', async () => {
    const data = makeExportData({
      dayUnlocks: [makeUnlock({ user_id: 'original-user' })],
    })
    await importProgress('new-user', data)
    expect(mockUnlocks[0].user_id).toBe('new-user')
  })

  it('re-stamps user_id on all imported quiz_results and recomputes id', async () => {
    const qr = makeQuizResult({ user_id: 'original-user' })
    const data = makeExportData({ quiz_results: [qr] })
    await importProgress('new-user', data)

    expect(mockQuizResults[0].user_id).toBe('new-user')
    expect(mockQuizResults[0].id).toBe(`new-user-${qr.question_id}-${qr.answered_at}`)
  })

  it('silently drops quiz_results with invalid question type', async () => {
    const data = makeExportData({
      quiz_results: [
        makeQuizResult({ question_type: 'mcq' }),
        // @ts-expect-error intentionally invalid
        makeQuizResult({ question_type: 'bogus' }),
      ],
    })
    await importProgress('new-user', data)
    expect(mockQuizResults).toHaveLength(1)
  })
})
