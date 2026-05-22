'use client'

import { useEffect, useRef, useState } from 'react'
import { findRelatedFRQ, frqTypeLabel } from '@/lib/domain/frq'
import type { FRQEntry } from '@/lib/domain/frq'

// ── MoralJudgmentDialog ───────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function MoralJudgmentDialog({ entry, onConfirm, onCancel }: {
  entry: FRQEntry
  onConfirm: () => void
  onCancel: () => void
}) {
  const [checked, setChecked] = useState([false])
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Auto-focus first interactive element, handle Escape, and trap Tab inside dialog
  useEffect(() => {
    firstButtonRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCancel(); return }
      if (e.key !== 'Tab') return
      const els = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []) as HTMLElement[]
      if (!els.length) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, j) => (j === i ? !v : v)))

  const allChecked = checked.every(Boolean)

  const items = [
    `我已独立完成 ${entry.year} Q${entry.question_number} 的作答，没有在中途查阅提示或答案`,
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moral-dialog-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-50 px-5 pt-5 pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-lg">
              ⚖️
            </div>
            <div>
              <p id="moral-dialog-title" className="text-sm font-semibold text-stone-800">查看答案前，请认真思考</p>
              <p className="text-xs text-stone-500 mt-0.5">{entry.year} · Q{entry.question_number} · {frqTypeLabel(entry.frq_type)}</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-stone-500">逐条确认后才能查看评分标准：</p>
          {items.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`mt-0.5 w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all ${
                  checked[i]
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-stone-300 group-hover:border-amber-400'
                }`}
                onClick={() => toggle(i)}
              >
                {checked[i] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs leading-relaxed transition-colors ${checked[i] ? 'text-stone-400 line-through' : 'text-stone-600'}`}
                onClick={() => toggle(i)}
              >
                {item}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            ref={firstButtonRef}
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            再想想
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              allChecked
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
          >
            已确认，查看答案
          </button>
        </div>
      </div>
    </div>
  )
}

// ── RelatedFRQCard ────────────────────────────────────────────────────────────

export function RelatedFRQCard({ conceptIds }: { conceptIds: string[] }) {
  const related = findRelatedFRQ(conceptIds)
  const [open, setOpen] = useState(false)
  const [judgmentEntry, setJudgmentEntry] = useState<FRQEntry | null>(null)

  if (!related.length) return null

  const openQuestion = (entry: FRQEntry) => {
    window.open(`${entry.frq_pdf}#page=${entry.frq_page}`, '_blank', 'noopener,noreferrer')
  }

  const confirmAnswer = (entry: FRQEntry) => {
    window.open(`${entry.sg_pdf}#page=${entry.sg_page ?? 1}`, '_blank', 'noopener,noreferrer')
    setJudgmentEntry(null)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">
        {/* Collapsible header */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="frq-card-content"
          className="w-full px-4 py-2.5 flex items-center justify-between bg-violet-50 hover:brightness-95 transition-all text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">FRQ</span>
            <span className="text-sm font-medium text-violet-700">历年相关真题</span>
            <span className="text-xs text-stone-400">按今日知识点匹配</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">{related.length} 题</span>
            <svg
              className={`w-3.5 h-3.5 text-stone-300 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Rows */}
        {open && (
          <div id="frq-card-content" className="divide-y divide-stone-50">
            {related.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-stone-400">{entry.year}</span>
                    <span className="text-xs font-semibold text-stone-700">Q{entry.question_number}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600">
                      {frqTypeLabel(entry.frq_type)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                    {entry.text_preview.slice(0, 130)}…
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openQuestion(entry)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors font-medium whitespace-nowrap"
                  >
                    查看题目 ↗
                  </button>
                  {entry.sg_pdf && (
                    <button
                      onClick={() => setJudgmentEntry(entry)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors whitespace-nowrap"
                    >
                      查看答案
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moral judgment dialog */}
      {judgmentEntry && (
        <MoralJudgmentDialog
          entry={judgmentEntry}
          onConfirm={() => confirmAnswer(judgmentEntry)}
          onCancel={() => setJudgmentEntry(null)}
        />
      )}
    </>
  )
}
