import { getDb } from '@/lib/infra/db'
import type { Resource, KnowledgePoint, Completion, QuizQuestion, QuizResult } from '@/lib/types'
import type { IRepository } from './interface'

export class DexieRepository implements IRepository {
  async getResources(week: number, day: number, tier: 'A' | 'B' | 'C'): Promise<Resource[]> {
    const db = getDb()
    return db.resources.where({ week, day, tier }).sortBy('slot_order')
  }

  async getBResources(conceptIds: string[], seenIds: Set<string>): Promise<Resource[]> {
    const db = getDb()
    return db.resources
      .where('concepts')
      .anyOf(conceptIds)
      .filter(r => r.tier === 'B' && !seenIds.has(r.id))
      .distinct()
      .toArray()
  }

  async getKnowledgePoint(id: string): Promise<KnowledgePoint | null> {
    const db = getDb()
    return (await db.knowledge_points.get(id)) ?? null
  }

  async getCompletions(userId: string, week: number, day: number): Promise<Completion[]> {
    const db = getDb()
    // Query resources for the day (all tiers), then filter completions by those IDs
    const dayResources = await db.resources.where({ week, day }).toArray()
    const resourceIds = new Set(dayResources.map(r => r.id))
    return db.completions
      .where('user_id')
      .equals(userId)
      .filter(c => resourceIds.has(c.resource_id))
      .toArray()
  }

  async getAllUserCompletions(userId: string): Promise<Completion[]> {
    const db = getDb()
    return db.completions.where('user_id').equals(userId).toArray()
  }

  async saveCompletion(completion: Completion): Promise<void> {
    const db = getDb()
    await db.completions.put(completion)
  }

  async isDayUnlocked(userId: string, week: number, day: number): Promise<boolean> {
    const db = getDb()
    const record = await db.day_unlocks.get([userId, week, day])
    return record !== undefined
  }

  async unlockDay(userId: string, week: number, day: number): Promise<void> {
    const db = getDb()
    await db.day_unlocks.put({
      user_id: userId,
      week,
      day,
      unlocked_at: new Date().toISOString(),
    })
  }

  async getUnlockedDays(userId: string): Promise<Array<{ week: number; day: number }>> {
    const db = getDb()
    const records = await db.day_unlocks.where('user_id').equals(userId).toArray()
    return records.map(r => ({ week: r.week, day: r.day }))
  }

  async getAllResources(): Promise<Resource[]> {
    const db = getDb()
    return db.resources.toArray()
  }

  async getAllDayResources(week: number, day: number): Promise<Resource[]> {
    const db = getDb()
    return db.resources.where({ week, day }).sortBy('slot_order')
  }

  async getKnowledgePoints(ids: string[]): Promise<KnowledgePoint[]> {
    const db = getDb()
    const results = await db.knowledge_points.bulkGet(ids)
    return results.filter((kp): kp is KnowledgePoint => kp !== undefined)
  }

  async getQuizQuestions(conceptIds: string[], seenIds: Set<string>): Promise<QuizQuestion[]> {
    const db = getDb()
    if (conceptIds.length === 0) return []
    return db.quiz_questions
      .where('concept_ids').anyOf(conceptIds)
      .filter(q => !seenIds.has(q.id))
      .distinct()
      .toArray()
  }

  async saveQuizResult(result: QuizResult): Promise<void> {
    const db = getDb()
    await db.quiz_results.put(result)
  }

  async getQuizResultsForDay(userId: string, week: number, day: number): Promise<QuizResult[]> {
    const db = getDb()
    return db.quiz_results
      .where('[user_id+week+day]')
      .equals([userId, week, day])
      .toArray()
  }

  async getAllQuizResultsForUser(userId: string): Promise<QuizResult[]> {
    const db = getDb()
    return db.quiz_results.where('user_id').equals(userId).toArray()
  }
}
