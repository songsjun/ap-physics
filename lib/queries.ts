import { getDb } from '@/lib/db'
import { LIBRARY_VERSION } from '@/lib/constants'
import type { Resource, KnowledgePoint } from '@/lib/types'

type RawResource = Omit<Resource, 'adapter_type' | 'phase' | 'slot_order' | 'content_body'> & {
  content_body?: object
  url?: string | null
  answer_url?: string
}

function deriveAdapterType(r: RawResource): Resource['adapter_type'] {
  if (r.type === 'interactive') return 'observation'
  if (r.platform === 'native' && r.type === 'quiz') return 'native_quiz'
  if (r.platform === 'native') return 'ai_graded_text'
  return 'external_manual'
}

function derivePhase(adapterType: Resource['adapter_type'], type: string): Resource['phase'] {
  if (adapterType === 'native_quiz' || adapterType === 'ai_graded_text') return 'CHECK'
  if (type === 'exercise') return 'PRACTICE'
  return 'LEARN'
}

const PHASE_ORDER: Record<Resource['phase'], number> = { LEARN: 0, PRACTICE: 1, CHECK: 2 }

function assignSlotOrders(resources: RawResource[]): Map<string, number> {
  const groups = new Map<string, RawResource[]>()
  for (const r of resources) {
    const key = `${r.week}-${r.day}-${r.tier}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  const result = new Map<string, number>()
  for (const group of groups.values()) {
    group.sort((a, b) => {
      const atA = deriveAdapterType(a)
      const atB = deriveAdapterType(b)
      const pA = PHASE_ORDER[derivePhase(atA, a.type)]
      const pB = PHASE_ORDER[derivePhase(atB, b.type)]
      if (pA !== pB) return pA - pB
      return a.id.localeCompare(b.id)
    })
    group.forEach((r, i) => result.set(r.id, i + 1))
  }
  return result
}

export async function seedContentLibrary(): Promise<void> {
  const db = getDb()
  const meta = await db.meta.get('content_version')
  if (meta?.value === LIBRARY_VERSION) return

  const { concepts, resources } = (await import('@/data/content_library.json')) as {
    metadata: unknown
    concepts: KnowledgePoint[]
    resources: RawResource[]
  }

  const slotOrders = assignSlotOrders(resources)

  const processed: Resource[] = resources.map(r => {
    const adapter_type = deriveAdapterType(r)
    return {
      ...r,
      adapter_type,
      phase: derivePhase(adapter_type, r.type),
      slot_order: slotOrders.get(r.id) ?? 0,
      content_body: r.content_body ?? null,
      url: r.url ?? null,
      answer_url: r.answer_url,
    }
  })

  await db.transaction('rw', db.knowledge_points, db.resources, db.meta, async () => {
    await db.knowledge_points.bulkPut(concepts as KnowledgePoint[])
    await db.resources.bulkPut(processed)
    await db.meta.put({ key: 'content_version', value: LIBRARY_VERSION })
  })
}
