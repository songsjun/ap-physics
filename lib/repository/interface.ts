import type { Resource, KnowledgePoint, Completion } from '@/lib/types'

export interface IRepository {
  getResources(week: number, day: number, tier: 'A' | 'B' | 'C'): Promise<Resource[]>
  getBResources(conceptIds: string[], seenIds: Set<string>): Promise<Resource[]>
  getKnowledgePoint(id: string): Promise<KnowledgePoint | null>
  getCompletions(userId: string, week: number, day: number): Promise<Completion[]>
  getAllUserCompletions(userId: string): Promise<Completion[]>
  saveCompletion(completion: Completion): Promise<void>
  isDayUnlocked(userId: string, week: number, day: number): Promise<boolean>
  unlockDay(userId: string, week: number, day: number): Promise<void>
  getUnlockedDays(userId: string): Promise<Array<{ week: number; day: number }>>
}
