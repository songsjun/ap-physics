import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Resource, KnowledgePoint, Completion, MetaRecord } from '@/lib/types'

export interface DayUnlock {
  user_id: string
  week: number
  day: number
  unlocked_at: string
}

export interface AppDB extends Dexie {
  resources: EntityTable<Resource, 'id'>
  knowledge_points: EntityTable<KnowledgePoint, 'id'>
  completions: Table<Completion>
  day_unlocks: Table<DayUnlock>
  meta: EntityTable<MetaRecord, 'key'>
}

let _db: AppDB | null = null

export function getDb(): AppDB {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in browser')
  }
  if (!_db) {
    _db = new Dexie('PhysicsLearningDB') as AppDB
    _db.version(1).stores({
      resources: 'id, week, day, tier, adapter_type, *concepts',
      knowledge_points: 'id, week, day',
      completions: '[user_id+resource_id], user_id, status',
      day_unlocks: '[user_id+week+day], user_id',
      meta: 'key',
    })
  }
  return _db
}
