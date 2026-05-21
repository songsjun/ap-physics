'use client'

import { useDayContext } from '@/lib/app/session-context'
import { ExternalCard } from '@/components/adapters/ExternalCard'
import type { Resource } from '@/lib/types'

export function DayView() {
  const { flowState, feedback } = useDayContext()

  switch (flowState.phase) {
    case 'LOCKED':
      return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold">此天尚未解锁</h2>
          <p className="text-gray-500 mt-2">完成上一天的学习任务后解锁</p>
        </div>
      )

    case 'PRESENTING':
      return (
        <div className="p-4">
          <div className="text-sm text-gray-400 text-center mb-4">
            第 {flowState.slot} / {flowState.total} 项
          </div>
          <ResourceAdapter resource={flowState.resource} />
        </div>
      )

    case 'REMEDIATION':
      return (
        <div className="p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800 max-w-2xl mx-auto">
            正在补充学习相关资料（{flowState.total - flowState.slot} / {flowState.total} 项剩余）
          </div>
          <ResourceAdapter resource={flowState.resources[0]} />
        </div>
      )

    case 'NEEDS_RETRY':
      return (
        <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
          <div className="text-4xl">📚</div>
          <h2 className="text-xl font-semibold">建议重新学习</h2>
          <p className="text-gray-500">本天的练习得分未达标，建议回顾 A 层资源后重新尝试。</p>
        </div>
      )

    case 'COMPLETE':
      return (
        <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-semibold">今日学习完成！</h2>
          <p className="text-gray-500">
            通过率：{Math.round(flowState.passRate * 100)}%
          </p>
          {feedback && (
            <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>强项：</strong>{feedback.strength}</p>
              {feedback.note && <p><strong>注意：</strong>{feedback.note}</p>}
              {feedback.preview && <p><strong>明日预习：</strong>{feedback.preview}</p>}
            </div>
          )}
          <a href="/" className="inline-block mt-2 text-blue-600 hover:underline text-sm">
            返回首页
          </a>
        </div>
      )
  }
}

function ResourceAdapter({ resource }: { resource: Resource }) {
  // Step 7 will add QuizCard, ChecklistCard, AIGradedCard
  // For now all resources use ExternalCard
  return <ExternalCard resource={resource} />
}
