import { repo } from '@/lib/repository'
import type { QuizQuestion } from '@/lib/types'

/**
 * Select questions for the daily challenge.
 * Returns count-1 regular questions (mcq/fill/short) + 1 feynman question.
 * Feynman selection prioritises concepts where the student has past failures;
 * falls back to the first available feynman question (highest-value by concept order).
 */
export async function selectDailyQuestions(
  userId: string,
  week: number,
  day: number,
  conceptIds: string[],
  count = 4,
): Promise<QuizQuestion[]> {
  if (conceptIds.length === 0) return []

  const answered = await repo.getQuizResultsForDay(userId, week, day)
  const seenIds = new Set(answered.map(r => r.question_id))

  const candidates = await repo.getQuizQuestions(conceptIds, seenIds)

  const regular = candidates.filter(q => q.type !== 'feynman')
  const feynmanPool = candidates.filter(q => q.type === 'feynman')

  // Regular questions: easy → medium → hard, up to count-1
  const easy = shuffle(regular.filter(q => q.difficulty === 1))
  const medium = shuffle(regular.filter(q => q.difficulty === 2))
  const hard = shuffle(regular.filter(q => q.difficulty === 3))
  const regularSelected = [...easy, ...medium, ...hard].slice(0, count - 1)

  // Feynman question: weak-concept-first, else first available
  const feynman = await pickFeynmanQuestion(userId, conceptIds, feynmanPool)

  return feynman ? [...regularSelected, feynman] : regularSelected
}

async function pickFeynmanQuestion(
  userId: string,
  conceptIds: string[],
  pool: QuizQuestion[],
): Promise<QuizQuestion | null> {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]

  const allResults = await repo.getAllQuizResultsForUser(userId)
  const conceptSet = new Set(conceptIds)

  // Net failure score per concept: each wrong answer +1, each correct -1
  const netFailures = new Map<string, number>()
  for (const r of allResults) {
    for (const cid of r.concept_ids) {
      if (!conceptSet.has(cid)) continue
      netFailures.set(cid, (netFailures.get(cid) ?? 0) + (r.correct ? -1 : 1))
    }
  }

  // Sort: highest net failures first; ties keep concept order (= learning priority)
  const sorted = [...pool].sort((a, b) => {
    const scoreA = Math.max(...a.concept_ids.map(id => netFailures.get(id) ?? 0))
    const scoreB = Math.max(...b.concept_ids.map(id => netFailures.get(id) ?? 0))
    return scoreB - scoreA
  })

  return sorted[0]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
