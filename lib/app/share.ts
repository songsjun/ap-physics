import { getDb, type DayUnlock } from '@/lib/db'
import type { Completion } from '@/lib/types'

export interface ExportData {
  version: 1
  exportedAt: string
  userId: string
  completions: Completion[]
  dayUnlocks: DayUnlock[]
}

export async function exportProgress(userId: string): Promise<ExportData> {
  const db = getDb()
  const [completions, dayUnlocks] = await Promise.all([
    db.completions.where('user_id').equals(userId).toArray(),
    db.day_unlocks.where('user_id').equals(userId).toArray(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    completions,
    dayUnlocks,
  }
}

export async function importProgress(userId: string, data: ExportData): Promise<void> {
  if (data.version !== 1) throw new Error('不支持的数据版本')
  const db = getDb()
  await db.transaction('rw', db.completions, db.day_unlocks, async () => {
    await db.completions.where('user_id').equals(userId).delete()
    await db.day_unlocks.where('user_id').equals(userId).delete()
    const completions = data.completions.map(c => ({ ...c, user_id: userId }))
    const unlocks = data.dayUnlocks.map(u => ({ ...u, user_id: userId }))
    await db.completions.bulkPut(completions)
    await db.day_unlocks.bulkPut(unlocks)
  })
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
