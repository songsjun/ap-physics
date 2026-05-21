import { StorageService } from '@/lib/infra/storage'
import type { DailyFeedback, DayStats, QuizQuestion, QuizGrade, ChatMessage } from '@/lib/types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

async function callClaudeWithMessages(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  system?: string,
  maxTokens = 300,
  signal?: AbortSignal,
): Promise<string> {
  const key = StorageService.apiKey.get()
  if (!key) return ''

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
  }
  if (system) body.system = system

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-request-type': 'CORS',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as AnthropicResponse
  return data.content[0]?.type === 'text' ? data.content[0].text : ''
}

async function callClaude(prompt: string, signal?: AbortSignal): Promise<string> {
  const key = StorageService.apiKey.get()
  if (!key) return ''

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-request-type': 'CORS',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as AnthropicResponse
  return data.content[0]?.type === 'text' ? data.content[0].text : ''
}

export const AIService = {
  async getDailyFeedback(
    stats: DayStats,
    ctx: { week: number; day: number },
    signal?: AbortSignal,
  ): Promise<DailyFeedback> {
    const key = StorageService.apiKey.get()
    if (!key) {
      return {
        strength: '今日学习已完成',
        note: '在设置页配置 Claude API Key 以获取个性化反馈',
        preview: '',
      }
    }

    const weak = stats.weakConcepts.length > 0 ? stats.weakConcepts.join('、') : '无'
    const prompt = `你是 AP 物理 1 学习教练。学生完成了 Week ${ctx.week} Day ${ctx.day}。
数据：通过率 ${Math.round(stats.passRate * 100)}%（通过 ${stats.passedCount} / 批改 ${stats.gradedCount}），薄弱知识点：${weak}。

请用中文给出简短鼓励性反馈，格式为纯 JSON（无额外文字）：
{"strength":"做得好的地方（1句）","note":"需注意或建议（1句，若无填空字符串）","preview":"明天的预告（1句，若无填空字符串）"}`

    try {
      const raw = await callClaude(prompt, signal)
      if (!raw) {
        return { strength: '今日学习已完成', note: '', preview: '' }
      }
      const match = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match?.[0] ?? '{}')
      return {
        strength: parsed.strength ?? '今日学习完成',
        note: parsed.note ?? '',
        preview: parsed.preview ?? '',
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      console.error('AI feedback error:', err)
      return { strength: '今日学习已完成', note: '', preview: '' }
    }
  },

  async gradeAnswer(
    question: QuizQuestion,
    studentAnswer: string,
    signal?: AbortSignal,
  ): Promise<QuizGrade> {
    // mcq and fill are graded locally — no AI needed
    if (question.type === 'mcq') {
      const correct = studentAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase()
      return { correct, feedback: question.explanation }
    }

    if (question.type === 'fill') {
      const normalize = (s: string) =>
        s.trim().toLowerCase().replace(/[，,；;\s]+/g, '|')
      if (normalize(studentAnswer) === normalize(question.answer)) {
        return { correct: true, feedback: question.explanation }
      }
      // Exact match failed — try AI to catch mathematically equivalent forms
      const key = StorageService.apiKey.get()
      if (!key) return { correct: false, feedback: question.explanation }

      const system = `你是 AP 物理 1 评分助手。判断两个答案是否数学等价（如 3L/4 与 0.75L 等价）。返回纯 JSON：{"correct":true/false,"feedback":"1句反馈"}`
      const userMsg = `题目：${question.question}\n标准答案：${question.answer}\n学生答案：${studentAnswer}\n是否等价？`
      try {
        const raw = await callClaudeWithMessages([{ role: 'user', content: userMsg }], system, 100, signal)
        const match = raw.match(/\{[\s\S]*\}/)
        const parsed = JSON.parse(match?.[0] ?? '{}')
        return { correct: parsed.correct ?? false, feedback: parsed.feedback ?? question.explanation }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        return { correct: false, feedback: question.explanation }
      }
    }

    // short answer: use AI
    const key = StorageService.apiKey.get()
    if (!key) {
      return { correct: true, feedback: question.explanation }
    }

    const system = `你是 AP 物理 1 评分助手。只评分，不教学。返回纯 JSON，格式：{"correct":true/false,"feedback":"1句反馈"}`
    const userMsg = `题目：${question.question}
正确答案：${question.answer}
评分要点：${question.grading_rubric}
学生回答：${studentAnswer}

判断是否正确，给出1句反馈。`

    try {
      const raw = await callClaudeWithMessages(
        [{ role: 'user', content: userMsg }],
        system,
        150,
        signal,
      )
      const match = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match?.[0] ?? '{}')
      return {
        correct: parsed.correct ?? false,
        feedback: parsed.feedback ?? question.explanation,
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      console.error('gradeAnswer error:', err)
      return { correct: false, feedback: question.explanation }
    }
  },

  async chat(
    messages: ChatMessage[],
    questionContext: QuizQuestion,
    signal?: AbortSignal,
  ): Promise<string> {
    const key = StorageService.apiKey.get()
    if (!key) return '请在设置页配置 Claude API Key 以启用 AI 问答。'

    const system = `你是 AP 物理 1 学习助手。学生刚完成了一道题，正在向你提问。
只针对以下题目内容回答，不回答其他话题。
题目：${questionContext.question}
正确答案：${questionContext.answer}
解析：${questionContext.explanation}
用中文回答，简洁（2-4句）。`

    try {
      return await callClaudeWithMessages(messages, system, 300, signal)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      console.error('chat error:', err)
      return '抱歉，AI 暂时无法响应，请稍后重试。'
    }
  },
}
