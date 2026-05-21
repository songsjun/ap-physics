'use client'

import { memo } from 'react'
import { useDayContext } from '@/lib/app/session-context'
import type { Resource } from '@/lib/types'

interface Props {
  resource: Resource
}

export const ExternalCard = memo(function ExternalCard({ resource }: Props) {
  const { dispatch } = useDayContext()

  async function handleComplete() {
    await dispatch({
      type: 'COMPLETE_RESOURCE',
      resourceId: resource.id,
      result: { status: 'passed' },
    })
  }

  async function handleSkip() {
    await dispatch({
      type: 'SKIP_RESOURCE',
      resourceId: resource.id,
    })
  }

  const phaseLabel = {
    LEARN: '学习',
    PRACTICE: '练习',
    CHECK: '检测',
  }[resource.phase]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{phaseLabel}</span>
        <span>{resource.platform}</span>
        <span>·</span>
        <span>约 {resource.estimated_minutes} 分钟</span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">{resource.title}</h2>

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          打开资源
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleComplete}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          已完成 ✓
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-2.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors text-sm"
        >
          跳过
        </button>
      </div>
    </div>
  )
})
