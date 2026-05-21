import { getDb } from '@/lib/db'
import { assembleDaySnapshot } from '@/lib/app/snapshot'
import { computeFlowState } from '@/lib/domain/flow'
import { tracker } from '@/lib/domain/progress'
import { AIService } from '@/lib/ai'
import { DAYS_PER_WEEK, WEEKS, PASS_THRESHOLD } from '@/lib/constants'
import type { Command, FlowState, DaySnapshot, DailyFeedback } from '@/lib/types'

function nextDay(week: number, day: number): [number, number] {
  if (day < DAYS_PER_WEEK) return [week, day + 1]
  if (week < WEEKS) return [week + 1, 1]
  return [week, day] // last day of last week: no next
}

export class DaySessionManager {
  private currentSnapshot: DaySnapshot | null = null
  private userId: string = ''
  private week: number = 0
  private day: number = 0

  async load(userId: string, week: number, day: number): Promise<FlowState> {
    this.userId = userId
    this.week = week
    this.day = day
    this.currentSnapshot = await assembleDaySnapshot(userId, week, day)
    const flowState = computeFlowState(this.currentSnapshot)

    // Auto-unlock next day for rest/review days that have no A-tier resources
    if (this.currentSnapshot.isUnlocked && this.currentSnapshot.aResources.length === 0) {
      const [nw, nd] = nextDay(week, day)
      if (nw !== week || nd !== day) {
        await tracker.unlockDay(userId, nw, nd)
      }
    }

    return flowState
  }

  async execute(command: Command): Promise<FlowState> {
    if (!this.currentSnapshot) throw new Error('Session not loaded')
    const { userId, week, day } = this

    if (command.type === 'COMPLETE_RESOURCE' || command.type === 'SKIP_RESOURCE') {
      const result =
        command.type === 'COMPLETE_RESOURCE'
          ? command.result
          : { status: 'skipped' as const }

      const db = getDb()
      const aResources = this.currentSnapshot.aResources
      const mode = this.currentSnapshot.mode

      await db.transaction('rw', db.completions, db.day_unlocks, async () => {
        await tracker.record(userId, command.resourceId, result)

        // Compute passRate using only db.completions (no db.resources access inside transaction)
        const aResourceIds = new Set(aResources.map(r => r.id))
        const allCompletions = await db.completions.where('user_id').equals(userId).toArray()
        const dayCompletions = allCompletions.filter(c => aResourceIds.has(c.resource_id))

        let passed = 0, failed = 0
        for (const c of dayCompletions) {
          if (c.status === 'passed') passed++
          else if (c.status === 'failed') failed++
        }
        const gradedCount = passed + failed
        const passRate = gradedCount === 0 ? 0 : passed / gradedCount
        const shouldUnlockNow = mode === 'REVIEW' || passRate >= PASS_THRESHOLD

        if (shouldUnlockNow) {
          const [nw, nd] = nextDay(week, day)
          if (nw !== week || nd !== day) {
            await tracker.unlockDay(userId, nw, nd)
          }
        }
      })
    }

    // Re-assemble snapshot and recompute flow state
    this.currentSnapshot = await assembleDaySnapshot(userId, week, day)
    return computeFlowState(this.currentSnapshot)
  }

  async requestFeedback(): Promise<DailyFeedback> {
    if (!this.currentSnapshot) throw new Error('Session not loaded')
    const stats = await tracker.getDayStats(
      this.userId,
      this.week,
      this.day,
      this.currentSnapshot.aResources,
    )
    return AIService.getDailyFeedback(stats, { week: this.week, day: this.day })
  }
}
