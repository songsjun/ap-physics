#!/usr/bin/env node
/**
 * prepare-d3-staging.mjs
 *
 * Reads D3 MCQ questions from two source files, filters low-quality questions,
 * randomizes answer positions (distributing evenly across A/B/C/D), updates
 * explanation letter references, and outputs a staging file for merge-questions.mjs.
 *
 * Sources:
 *   scripts/d3-mcq-questions.md  — 47 comprehensive multi-step questions (primary)
 *   data/d3_mcqs.json            — 47 conceptual questions (supplementary, -v2 IDs)
 *
 * Usage:
 *   node scripts/prepare-d3-staging.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: { 'dry-run': { type: 'boolean', default: false } },
})

// ── Load sources ──────────────────────────────────────────────────────────────

const mdContent = readFileSync(join(ROOT, 'scripts/d3-mcq-questions.md'), 'utf8')
const mdMatch = mdContent.match(/```json\n([\s\S]*?)\n```/)
if (!mdMatch) { console.error('Cannot find JSON block in d3-mcq-questions.md'); process.exit(1) }
const mdQuestions = JSON.parse(mdMatch[1])

const jsonQuestions = JSON.parse(
  readFileSync(join(ROOT, 'data/d3_mcqs.json'), 'utf8')
)

console.log(`Loaded ${mdQuestions.length} questions from md file`)
console.log(`Loaded ${jsonQuestions.length} questions from json file`)

// ── Filter low-quality questions from json ────────────────────────────────────
// Excluded: D1-level recall questions that don't reach D3 difficulty standard

const EXCLUDED_JSON_IDS = new Set([
  'torque-torque-d3-1',           // D1: door handle placement — trivial concept recall
  'rotation-torque-work-d3-1',    // D1: W=τθ formula recall, no reasoning required
  'rotation-angular-momentum-d3-1', // D2: skater spins faster — qualitative recall
  'fluids-density-structure-d3-1',  // D1: oil floats on water — trivial observation
])

const filteredJson = jsonQuestions.filter(q => {
  if (EXCLUDED_JSON_IDS.has(q.id)) {
    console.log(`  skip (low quality): ${q.id}`)
    return false
  }
  return true
})
console.log(`\nJson after filtering: ${filteredJson.length} questions`)

// ── Answer randomization ──────────────────────────────────────────────────────
// All source questions have answer "A". Distribute evenly across B,C,D,A
// (starting from B so the added questions offset the existing bank's A-bias).

const LETTERS = ['A', 'B', 'C', 'D']

/**
 * Replace standalone letter references in explanation text.
 * Handles patterns like:
 *   "正解 A：", "B 错：", "C 错：", "(A)", "(B 错)"
 */
function remapLetters(text, letterMap) {
  if (!text) return text
  // "正解 X" pattern
  let result = text.replace(/正解\s+([A-D])/g, (_, l) => `正解 ${letterMap[l] ?? l}`)
  // "X 错" pattern (standalone letter before 错)
  result = result.replace(/\b([A-D])\s*错/g, (_, l) => `${letterMap[l] ?? l} 错`)
  return result
}

let globalIdx = 0

function randomizeAnswer(q) {
  // Cycle B,C,D,A,B,C,D,A,... for even distribution
  const targetLetter = LETTERS[(globalIdx + 1) % 4]  // offset by 1 to start at B
  globalIdx++

  if (targetLetter === 'A') return q  // no change needed

  const targetIdx = LETTERS.indexOf(targetLetter)

  // Clone and swap option at idx 0 (correct) with targetIdx
  const opts = [...q.options]
  ;[opts[0], opts[targetIdx]] = [opts[targetIdx], opts[0]]

  // Strip existing labels and relabel
  const relabeled = opts.map((opt, i) => {
    const text = opt.replace(/^[A-D]\.\s*/, '')
    return `${LETTERS[i]}. ${text}`
  })

  // Build letter remapping: original A → targetLetter, original targetLetter → A
  const letterMap = { A: targetLetter, [targetLetter]: 'A' }

  return {
    ...q,
    options: relabeled,
    answer: targetLetter,
    explanation: remapLetters(q.explanation, letterMap),
  }
}

// ── Process questions ─────────────────────────────────────────────────────────

const processedMd = mdQuestions.map(q => randomizeAnswer(q))

const processedJson = filteredJson.map(q =>
  randomizeAnswer({ ...q, id: q.id + '-v2' })
)

const allNew = [...processedMd, ...processedJson]

// ── Verify answer distribution ────────────────────────────────────────────────

const dist = { A: 0, B: 0, C: 0, D: 0 }
allNew.forEach(q => dist[q.answer]++)
console.log('\nAnswer distribution in staged questions:')
Object.entries(dist).forEach(([l, n]) => console.log(`  ${l}: ${n}`))

// ── Write staging file ────────────────────────────────────────────────────────

const outPath = join(ROOT, 'scripts/generated-questions.json')

if (args['dry-run']) {
  console.log(`\nDRY RUN — would write ${allNew.length} questions to ${outPath}`)
  process.exit(0)
}

writeFileSync(outPath, JSON.stringify(allNew, null, 2), 'utf8')
console.log(`\nWrote ${allNew.length} questions to scripts/generated-questions.json`)
console.log(`  From md  : ${processedMd.length}`)
console.log(`  From json: ${processedJson.length}`)
console.log('\nNext steps:')
console.log('  python3 -m json.tool scripts/generated-questions.json > /dev/null')
console.log('  node scripts/merge-questions.mjs')
