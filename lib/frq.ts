import frqMap from '@/data/frq_map.json'

export interface FRQEntry {
  id: string
  year: number
  question_number: number
  frq_type: string
  frq_pdf: string
  frq_page: number
  sg_pdf?: string
  sg_page?: number
  concepts: string[]
  text_preview: string
}

const ALL_QUESTIONS: FRQEntry[] = frqMap.questions as FRQEntry[]

export function findRelatedFRQ(conceptIds: string[]): FRQEntry[] {
  if (!conceptIds.length) return []
  const set = new Set(conceptIds)
  const scored = ALL_QUESTIONS.map(q => ({
    q,
    score: q.concepts.filter(c => set.has(c)).length,
  }))
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || b.q.year - a.q.year)
    .map(x => x.q)
    .slice(0, 6)
}

export function frqTypeLabel(frq_type: string): string {
  const map: Record<string, string> = {
    type1_mathematical: 'Type 1 数学推导',
    type2_representation: 'Type 2 多重表征',
    type3_experimental: 'Type 3 实验设计',
    type4_qualitative: 'Type 4 定性定量',
    type4_short: '短答题',
    type5_short: '短答题',
  }
  return map[frq_type] ?? frq_type
}
