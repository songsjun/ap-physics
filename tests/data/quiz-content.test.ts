// @vitest-environment node
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'
import type { QuizQuestion } from '@/lib/types'

// Test the deployed quiz bank (public/quiz-bank.json) — the file actually loaded
// at runtime — not the generation-pipeline source files in data/ or scripts/.
const questions = JSON.parse(
  readFileSync(join(__dirname, '../../public/quiz-bank.json'), 'utf8')
) as QuizQuestion[]

const CJK_RE = /[\u3400-\u9fff]/

function visibleFields(q: QuizQuestion): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['question', q.question],
    ['answer', q.answer],
    ['grading_rubric', q.grading_rubric],
    ['explanation', q.explanation],
  ]
  q.options?.forEach((option, index) => fields.push([`options[${index}]`, option]))
  return fields
}

// ── Structural integrity ───────────────────────────────────────────────────────

describe('quiz bank — structural integrity', () => {
  it('all questions have required fields', () => {
    const required = ['id', 'concept_ids', 'week', 'difficulty', 'type', 'question', 'answer', 'grading_rubric', 'explanation'] as const
    for (const q of questions) {
      for (const field of required) {
        expect(q[field], `Question ${q.id} missing field "${field}"`).toBeDefined()
        expect(q[field], `Question ${q.id} has empty field "${field}"`).not.toBe('')
      }
    }
  })

  it('all question ids are unique', () => {
    const ids = questions.map(q => q.id)
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx)
    expect(duplicates, `Duplicate IDs: ${duplicates.join(', ')}`).toHaveLength(0)
  })

  it('week is in range 1–8', () => {
    for (const q of questions) {
      expect(q.week, `Question ${q.id}: week=${q.week} out of range`).toBeGreaterThanOrEqual(1)
      expect(q.week, `Question ${q.id}: week=${q.week} out of range`).toBeLessThanOrEqual(8)
    }
  })

  it('difficulty is 1, 2, or 3', () => {
    for (const q of questions) {
      expect([1, 2, 3], `Question ${q.id}: difficulty=${q.difficulty} invalid`).toContain(q.difficulty)
    }
  })

  it('type is one of the allowed values', () => {
    const VALID_TYPES = ['mcq', 'fill', 'short', 'feynman']
    for (const q of questions) {
      expect(VALID_TYPES, `Question ${q.id}: type="${q.type}" invalid`).toContain(q.type)
    }
  })

  it('MCQ questions have exactly 4 options', () => {
    for (const q of questions) {
      if (q.type === 'mcq') {
        expect(q.options, `MCQ question ${q.id} missing options`).toBeDefined()
        expect(q.options!.length, `MCQ question ${q.id} must have 4 options`).toBe(4)
        for (const option of q.options!) {
          expect(option.trim(), `MCQ question ${q.id} has an empty option`).not.toBe('')
        }
      }
    }
  })

  it('concept_ids is a non-empty array of strings', () => {
    for (const q of questions) {
      expect(Array.isArray(q.concept_ids), `Question ${q.id}: concept_ids is not an array`).toBe(true)
      expect(q.concept_ids.length, `Question ${q.id}: concept_ids is empty`).toBeGreaterThan(0)
      for (const c of q.concept_ids) {
        expect(typeof c, `Question ${q.id}: concept_id is not a string`).toBe('string')
      }
    }
  })
})

// ── Runtime and language contract ──────────────────────────────────────────────

describe('quiz bank — runtime and language contract', () => {
  it('MCQ answer exactly matches one rendered option', () => {
    for (const q of questions) {
      if (q.type !== 'mcq' || !q.options) continue
      expect(
        q.options.map(option => option.trim().toLowerCase()),
        `Question ${q.id}: answer must exactly match one rendered option because QuizPanel grades by selected option text`,
      ).toContain(q.answer.trim().toLowerCase())
    }
  })

  it('all user-visible quiz text is English-only', () => {
    for (const q of questions) {
      for (const [field, value] of visibleFields(q)) {
        expect(CJK_RE.test(value), `Question ${q.id}: ${field} still contains CJK text`).toBe(false)
      }
    }
  })

  it('all objective questions include grading guidance and feedback', () => {
    for (const q of questions) {
      if (!['mcq', 'fill'].includes(q.type)) continue
      expect(q.grading_rubric.trim().length, `Question ${q.id}: missing grading rubric`).toBeGreaterThan(0)
      expect(q.explanation.trim().length, `Question ${q.id}: missing explanation`).toBeGreaterThan(0)
    }
  })
})
