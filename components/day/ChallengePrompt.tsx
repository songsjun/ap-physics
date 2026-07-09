'use client'

interface ChallengePromptProps {
  onStart: () => void
  questionCount: number
  ready: boolean
}

export function ChallengePrompt({ onStart, questionCount, ready }: ChallengePromptProps) {
  const hasQuestions = questionCount > 0
  const estimatedSecs = questionCount * 45

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">⚡</span>
        <span className="text-sm font-medium text-stone-700">Daily Practice</span>
      </div>
      <div>
        <p className="text-xs text-stone-400">
          {!ready
            ? "Preparing today's questions..."
            : hasQuestions
              ? 'Test what you learned today.'
              : 'All related questions completed. Keep studying new content to unlock more.'}
        </p>
        {ready && hasQuestions && (
          <p className="text-xs text-stone-400 mt-0.5">{questionCount} questions · ~{estimatedSecs}s</p>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onStart}
          disabled={!ready || !hasQuestions}
          className={`text-sm rounded-lg py-2 px-4 transition-colors ${
            ready && hasQuestions
              ? 'bg-stone-800 text-white hover:bg-stone-700'
              : 'bg-stone-100 text-stone-300 cursor-not-allowed'
          }`}
        >
          {!ready ? 'Loading...' : hasQuestions ? 'Start Practice' : 'No Questions'}
        </button>
      </div>
    </div>
  )
}
