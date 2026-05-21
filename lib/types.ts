// ── FlowState: output of LearningFlow, UI rendering basis ──
export type FlowState =
  | { phase: 'LOCKED' }
  | { phase: 'PRESENTING'; resource: Resource; slot: number; total: number }
  | { phase: 'REMEDIATION'; resources: Resource[]; slot: number; total: number }
  | { phase: 'NEEDS_RETRY' }
  | { phase: 'COMPLETE'; passRate: number }

// ── Command: the only operations Presentation layer can emit ──
export type Command =
  | { type: 'COMPLETE_RESOURCE'; resourceId: string; result: CompletionResult }
  | { type: 'SKIP_RESOURCE'; resourceId: string }
  | { type: 'REQUEST_FEEDBACK' }

// ── DayMode: affects LearningFlow decision logic ──
export type DayMode = 'STANDARD' | 'REVIEW'

// ── DaySnapshot: input to LearningFlow, built by assembleDaySnapshot ──
export interface DaySnapshot {
  isUnlocked: boolean
  mode: DayMode
  aResources: Resource[]
  completions: Map<string, Completion>
  bCandidates: Resource[]
  bTotalForSession: number
}

// ── DayStats: read output of ProgressTracker ──
export interface DayStats {
  passRate: number
  passedCount: number
  failedCount: number
  gradedCount: number
  totalACount: number
  weakConcepts: string[]
  seenResourceIds: Set<string>
}

// ── Resource: content library item ──
export interface Resource {
  id: string
  title: string
  url: string | null
  answer_url?: string
  content_body: object | null
  adapter_type: 'external_manual' | 'native_quiz' | 'ai_graded_text' | 'observation'
  type: string
  platform: string
  tier: 'A' | 'B' | 'C'
  phase: 'LEARN' | 'PRACTICE' | 'CHECK'
  estimated_minutes: number
  concepts: string[]
  week: number
  day: number
  slot_order: number
}

// ── KnowledgePoint: curriculum node ──
export interface KnowledgePoint {
  id: string
  name_zh: string
  name_en: string
  unit: number
  ced_topic: string
  prerequisites: string[]
  openstax_sections: string[]
  week: number
  day: number
}

// ── Completion: persisted user record ──
export interface Completion {
  user_id: string
  resource_id: string
  status: 'passed' | 'failed' | 'skipped'
  score?: number
  score_max?: number
  ai_feedback?: string
  completed_at: string
}

// ── CompletionResult: unified output from adapter components ──
export interface CompletionResult {
  status: 'passed' | 'failed' | 'skipped'
  score?: number
  score_max?: number
  ai_feedback?: string
}

// ── AI output types ──
export interface GradeResult {
  status: 'passed' | 'failed'
  step_errors: string[]
  feedback: string
}

export interface DailyFeedback {
  strength: string
  note: string
  preview: string
}

// ── DB meta record ──
export interface MetaRecord {
  key: string
  value: string
}

// ── Progress snapshot for dashboard ──
export interface ProgressSnapshot {
  completedDays: Array<{ week: number; day: number; passRate: number }>
  currentWeek: number
  currentDay: number
}
