import { getDb, type DayUnlock } from '@/lib/infra/db'
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
  if (!Array.isArray(data.completions) || !Array.isArray(data.dayUnlocks)) {
    throw new Error('数据格式错误：completions 或 dayUnlocks 不是数组')
  }

  // Whitelist validation: filter out records with missing required fields
  const validCompletions = data.completions.filter(
    (c): c is typeof c =>
      typeof c === 'object' && c !== null &&
      typeof (c as any).resource_id === 'string' &&
      typeof (c as any).completed_at === 'string' &&
      ['passed', 'failed', 'skipped'].includes((c as any).status)
  )
  const validUnlocks = data.dayUnlocks.filter(
    (u): u is typeof u =>
      typeof u === 'object' && u !== null &&
      typeof (u as any).week === 'number' &&
      typeof (u as any).day === 'number' &&
      typeof (u as any).unlocked_at === 'string'
  )

  const db = getDb()
  await db.transaction('rw', db.completions, db.day_unlocks, async () => {
    await db.completions.where('user_id').equals(userId).delete()
    await db.day_unlocks.where('user_id').equals(userId).delete()
    const completions = validCompletions.map(c => ({ ...c, user_id: userId }))
    const unlocks = validUnlocks.map(u => ({ ...u, user_id: userId }))
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
