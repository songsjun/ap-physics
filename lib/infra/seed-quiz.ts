import { getDb } from '@/lib/infra/db'
import { QUIZ_BANK_VERSION } from '@/lib/constants'
import type { QuizQuestion } from '@/lib/types'

export async function seedQuizBank(): Promise<void> {
  const db = getDb()
  const meta = await db.meta.get('quiz_bank_version')
  if (meta?.value === QUIZ_BANK_VERSION) return

  const res = await fetch('/quiz-bank.json')
  if (!res.ok) {
    console.warn('quiz-bank.json not found, skipping quiz seed')
    return
  }
  const questions: QuizQuestion[] = await res.json()
  await db.quiz_questions.bulkPut(questions)
  await db.meta.put({ key: 'quiz_bank_version', value: QUIZ_BANK_VERSION })
}
