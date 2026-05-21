import { StorageService } from '@/lib/storage'
import type { DailyFeedback, DayStats } from '@/lib/types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
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
}
