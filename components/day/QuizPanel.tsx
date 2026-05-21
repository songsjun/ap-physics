'use client'

import { useEffect, useState } from 'react'
import { selectDailyQuestions } from '@/lib/app/quiz'
import { AIService } from '@/lib/infra/ai'
import { repo } from '@/lib/repository'
import { StorageService } from '@/lib/infra/storage'
import type { QuizQuestion, QuizResult, QuizGrade, ChatMessage } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type QuizPhase = 'loading' | 'question' | 'grading' | 'result' | 'chat' | 'summary'

interface QuizPanelProps {
  week: number
  day: number
  conceptIds: string[]
  onComplete: (results: QuizResult[]) => void
  onExit: () => void
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
    </div>
  )
}

// ── QuizPanel ─────────────────────────────────────────────────────────────────

export function QuizPanel({ week, day, conceptIds, onComplete, onExit }: QuizPanelProps) {
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [grade, setGrade] = useState<QuizGrade | null>(null)
  const [sessionResults, setSessionResults] = useState<QuizResult[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Load questions on mount
  useEffect(() => {
    const userId = StorageService.userId.get()
    if (!userId) { onExit(); return }
    selectDailyQuestions(userId, week, day, conceptIds, 4).then(qs => {
      if (qs.length === 0) { onExit(); return }
      setQuestions(qs)
      setPhase('question')
    }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, day])

  async function handleSubmit() {
    const q = questions[currentIdx]
    const userAnswer = q.type === 'mcq' ? (selectedOption ?? '') : answer.trim()
    if (!userAnswer) return
    setPhase('grading')
    const g = await AIService.gradeAnswer(q, userAnswer).catch(() => ({
      correct: false,
      feedback: q.explanation,
    }))
    setGrade(g)
    const userId = StorageService.userId.get()
    if (userId) {
      const result: QuizResult = {
        id: `${userId}-${q.id}-${Date.now()}`,
        user_id: userId,
        question_id: q.id,
        concept_ids: q.concept_ids,
        week,
        day,
        correct: g.correct,
        student_answer: userAnswer,
        answered_at: new Date().toISOString(),
      }
      await repo.saveQuizResult(result).catch(console.error)
      setSessionResults(prev => [...prev, result])
    }
    setPhase('result')
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setPhase('summary')
    } else {
      setCurrentIdx(i => i + 1)
      setAnswer('')
      setSelectedOption(null)
      setGrade(null)
      setChatMessages([])
      setPhase('question')
    }
  }

  async function handleChat() {
    if (!chatInput.trim() || !grade) return
    const q = questions[currentIdx]
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const reply = await AIService.chat(newMessages, q)
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch { /* ignore */ } finally {
      setChatLoading(false)
    }
  }

  // ── Render: loading ──────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-stone-100 rounded w-1/4" />
          <div className="h-4 bg-stone-100 rounded w-full" />
          <div className="h-4 bg-stone-100 rounded w-3/4" />
        </div>
      </div>
    )
  }

  // ── Render: summary ──────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const regularResults = sessionResults.filter(r => {
      const q = questions.find(q => q.id === r.question_id)
      return q?.type !== 'feynman'
    })
    const feynmanResult = sessionResults.find(r => {
      const q = questions.find(q => q.id === r.question_id)
      return q?.type === 'feynman'
    })
    const correct = regularResults.filter(r => r.correct).length
    const total = regularResults.length
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-lg">✦</p>
          <p className="text-sm font-semibold text-stone-800">挑战完成！</p>
          <p className="text-xs text-stone-500">
            {correct} / {total} 正确
            {feynmanResult && ' · 费曼反思已完成'}
          </p>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1">
          {sessionResults.map((r, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${r.correct ? 'bg-emerald-400' : 'bg-red-300'}`}
            />
          ))}
        </div>
        <button
          onClick={() => onComplete(sessionResults)}
          className="w-full py-2 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg transition-colors"
        >
          关闭
        </button>
      </div>
    )
  }

  const q = questions[currentIdx]
  const isLast = currentIdx + 1 >= questions.length

  // ── Render: question ─────────────────────────────────────────────────────────
  if (phase === 'question') {
    const hasAnswer = q.type === 'mcq' ? selectedOption !== null : answer.trim().length > 0
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        {/* Progress */}
        <p className="text-xs text-stone-400">{currentIdx + 1} / {questions.length}</p>

        {/* Question */}
        <p className="text-sm font-medium text-stone-800">{q.question}</p>

        {/* MCQ options */}
        {q.type === 'mcq' && q.options && (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left text-sm rounded-lg py-2 px-3 border transition-colors ${
                  selectedOption === opt
                    ? 'border-blue-400 bg-blue-50 text-blue-800'
                    : 'border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Fill / Short answer */}
        {(q.type === 'fill' || q.type === 'short') && (
          q.type === 'fill' ? (
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && hasAnswer) handleSubmit() }}
              placeholder="输入答案…"
              className="border border-stone-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:border-blue-400"
            />
          ) : (
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="输入答案…"
              rows={3}
              className="border border-stone-200 rounded-lg p-2 w-full text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          )
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            退出
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer}
            className={`text-sm rounded-lg py-2 px-4 transition-colors ${
              hasAnswer
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
          >
            提交
          </button>
        </div>
      </div>
    )
  }

  // ── Render: grading ──────────────────────────────────────────────────────────
  if (phase === 'grading') {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <Spinner />
        <p className="text-xs text-center text-stone-400">AI 正在批改…</p>
      </div>
    )
  }

  // ── Render: result ───────────────────────────────────────────────────────────
  if (phase === 'result' && grade) {
    const userAnswer = q.type === 'mcq' ? (selectedOption ?? '') : answer.trim()
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        {/* Progress */}
        <p className="text-xs text-stone-400">{currentIdx + 1} / {questions.length}</p>

        {/* Result badge */}
        {q.type === 'feynman' ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
            费曼反思
          </div>
        ) : (
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            grade.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {grade.correct ? '✓ 正确' : '✕ 错误'}
          </div>
        )}

        {/* Student answer */}
        <div>
          <p className="text-xs text-stone-400">你的回答</p>
          <p className="text-sm text-stone-700 mt-0.5">{userAnswer}</p>
        </div>

        {/* Correct answer (if wrong) */}
        {!grade.correct && (
          <div>
            <p className="text-xs text-stone-400">正确答案</p>
            <p className="text-sm text-emerald-700 mt-0.5">{q.answer}</p>
          </div>
        )}

        {/* Explanation / feedback */}
        <p className="text-sm text-stone-600">{grade.feedback}</p>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPhase('chat')}
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            继续追问 AI →
          </button>
          <button
            onClick={handleNext}
            className="text-sm bg-stone-800 text-white rounded-lg py-2 px-4 hover:bg-stone-700 transition-colors"
          >
            {isLast ? '查看总结 →' : '下一题 →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Render: chat ─────────────────────────────────────────────────────────────
  if (phase === 'chat') {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        {/* Back link */}
        <button
          onClick={() => setPhase('result')}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← 回到题目
        </button>

        {/* Message list */}
        <div className="max-h-64 overflow-y-auto space-y-2 py-1">
          {chatMessages.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">向 AI 提问关于这道题的任何问题</p>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs rounded-lg px-3 py-2 max-w-[85%] ${
                msg.role === 'user'
                  ? 'ml-auto bg-blue-50 text-blue-800'
                  : 'mr-auto bg-stone-50 text-stone-700'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="mr-auto bg-stone-50 text-stone-400 text-xs rounded-lg px-3 py-2 max-w-[85%] animate-pulse">
              AI 正在思考…
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !chatLoading) handleChat() }}
            placeholder="提问…"
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleChat}
            disabled={chatLoading || !chatInput.trim()}
            className={`text-xs rounded-lg px-3 py-2 transition-colors ${
              chatLoading || !chatInput.trim()
                ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            发送
          </button>
        </div>

        {/* Next question always visible */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleNext}
            className="text-sm bg-stone-800 text-white rounded-lg py-2 px-4 hover:bg-stone-700 transition-colors"
          >
            {isLast ? '查看总结 →' : '下一题 →'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
