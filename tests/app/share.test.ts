// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import type { Completion, QuizResult } from '@/lib/types'
import type { IRepository } from '@/lib/repository'

import { importProgress } from '@/lib/app/share'
import type { ExportData } from '@/lib/app/share'

interface DayUnlock {
  user_id: string
  week: number
  day: number
  unlocked_at: string
}

const mockCompletions: Completion[] = []
const mockUnlocks: DayUnlock[] = []
const mockQuizResults: QuizResult[] = []

const mockRepo: Pick<
  IRepository,
  | 'getAllUserCompletions'
  | 'getUnlockedDays'
  | 'getAllQuizResultsForUser'
  | 'transact'
  | 'saveCompletion'
  | 'unlockDay'
  | 'saveQuizResult'
> = {
  getAllUserCompletions: async () => mockCompletions,
  getUnlockedDays: async () => mockUnlocks.map(({ week, day }) => ({ week, day })),
  getAllQuizResultsForUser: async () => mockQuizResults,
  transact: async fn => { await fn() },
  saveCompletion: async completion => { mockCompletions.push(completion) },
  unlockDay: async (userId, week, day) => {
    mockUnlocks.push({ user_id: userId, week, day, unlocked_at: '2026-01-01T00:00:00.000Z' })
  },
  saveQuizResult: async result => { mockQuizResults.push(result) },
}

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

async function importWithMockRepo(userId: string, data: ExportData): Promise<void> {
  await importProgress(userId, data, mockRepo)
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
    await expect(importWithMockRepo('u1', makeExportData({ version: 3 }))).rejects.toThrow('不支持的数据版本')
  })

  it('silently drops completions with invalid status', async () => {
    const data = makeExportData({
      completions: [
        makeCompletion({ status: 'passed' }),
        // @ts-expect-error intentionally invalid
        makeCompletion({ status: 'cheated' }),
      ],
    })
    await importWithMockRepo('new-user', data)
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
    await importWithMockRepo('new-user', data)
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
    await importWithMockRepo('new-user', data)
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
    await expect(importWithMockRepo('new-user', data)).resolves.toBeUndefined()
    expect(mockCompletions).toHaveLength(1)
    expect(mockQuizResults).toHaveLength(0)
  })

  it('re-stamps user_id on all imported completions', async () => {
    const data = makeExportData({
      completions: [makeCompletion({ user_id: 'original-user' })],
    })
    await importWithMockRepo('new-user', data)
    expect(mockCompletions[0].user_id).toBe('new-user')
  })

  it('re-stamps user_id on all imported dayUnlocks', async () => {
    const data = makeExportData({
      dayUnlocks: [makeUnlock({ user_id: 'original-user' })],
    })
    await importWithMockRepo('new-user', data)
    expect(mockUnlocks[0].user_id).toBe('new-user')
  })

  it('re-stamps user_id on all imported quiz_results and recomputes id', async () => {
    const qr = makeQuizResult({ user_id: 'original-user' })
    const data = makeExportData({ quiz_results: [qr] })
    await importWithMockRepo('new-user', data)

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
    await importWithMockRepo('new-user', data)
    expect(mockQuizResults).toHaveLength(1)
  })
})
