import { repo } from '@/lib/repository'
import type { QuizQuestion } from '@/lib/types'

/**
 * Select questions for the daily challenge.
 * Picks from questions matching today's concepts, excluding already-answered ones.
 * Mix of difficulty 1 and 2; up to `count` questions.
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

  // Prefer difficulty 1 and 2; shuffle within each group
  const easy = shuffle(candidates.filter(q => q.difficulty === 1))
  const medium = shuffle(candidates.filter(q => q.difficulty === 2))
  const hard = shuffle(candidates.filter(q => q.difficulty === 3))

  return [...easy, ...medium, ...hard].slice(0, count)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
