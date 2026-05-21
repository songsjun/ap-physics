import { getDb } from '@/lib/infra/db'
import { assembleDaySnapshot } from '@/lib/app/snapshot'
import { computeFlowState, shouldUnlock } from '@/lib/domain/flow'
import { tracker } from '@/lib/domain/progress'
import { AIService } from '@/lib/infra/ai'
import { DAYS_PER_WEEK, WEEKS } from '@/lib/constants'
import type { Command, FlowState, DaySnapshot, DailyFeedback, DayStats } from '@/lib/types'

function nextDay(week: number, day: number): [number, number] {
  if (day < DAYS_PER_WEEK) return [week, day + 1]
  if (week < WEEKS) return [week + 1, 1]
  return [week, day]
}

export class DaySessionManager {
  private currentSnapshot: DaySnapshot | null = null
  private userId: string = ''
  private week: number = 0
  private day: number = 0
  private bTotalForSession: number = 0

  async load(userId: string, week: number, day: number): Promise<FlowState> {
    this.userId = userId
    this.week = week
    this.day = day
    const snapshot = await assembleDaySnapshot(userId, week, day)
    this.bTotalForSession = snapshot.bCandidates.length
    this.currentSnapshot = { ...snapshot, bTotalForSession: this.bTotalForSession }

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

    const wasInRemediation = computeFlowState(this.currentSnapshot).phase === 'REMEDIATION'

    if (command.type === 'COMPLETE_RESOURCE' || command.type === 'SKIP_RESOURCE') {
      const result =
        command.type === 'COMPLETE_RESOURCE'
          ? command.result
          : { status: 'skipped' as const }

      const db = getDb()
      const aResources = this.currentSnapshot.aResources
      const aResourceIds = new Set(aResources.map(r => r.id))
      const mode = this.currentSnapshot.mode

      await db.transaction('rw', db.completions, db.day_unlocks, async () => {
        await tracker.record(userId, command.resourceId, result)

        // Query only this day's A-tier completions (avoids full-table scan)
        const dayCompletions = await db.completions
          .where('user_id')
          .equals(userId)
          .filter(c => aResourceIds.has(c.resource_id))
          .toArray()

        let passed = 0, failed = 0
        for (const c of dayCompletions) {
          if (c.status === 'passed') passed++
          else if (c.status === 'failed') failed++
        }
        const gradedCount = passed + failed
        const stats: DayStats = {
          passRate: gradedCount === 0 ? 0 : passed / gradedCount,
          passedCount: passed,
          failedCount: failed,
          gradedCount,
          totalACount: aResources.length,
          weakConcepts: [],
          seenResourceIds: new Set(),
        }

        if (shouldUnlock(stats, mode)) {
          const [nw, nd] = nextDay(week, day)
          if (nw !== week || nd !== day) {
            await tracker.unlockDay(userId, nw, nd)
          }
        }
      })
    }

    // Re-assemble snapshot and recompute flow state
    const newSnapshot = await assembleDaySnapshot(userId, week, day)

    // Freeze bTotalForSession on first entry into REMEDIATION; preserve while in it
    if (!wasInRemediation) {
      this.bTotalForSession = newSnapshot.bCandidates.length
    }
    this.currentSnapshot = { ...newSnapshot, bTotalForSession: this.bTotalForSession }

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
