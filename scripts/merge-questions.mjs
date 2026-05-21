#!/usr/bin/env node
/**
 * merge-questions.mjs
 *
 * Merges reviewed questions from the staging file into quiz-bank.json,
 * then bumps QUIZ_BANK_VERSION in lib/constants.ts to trigger re-seeding.
 *
 * Usage:
 *   node scripts/merge-questions.mjs [--staging <file>] [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    staging:   { type: 'string',  default: 'scripts/generated-questions.json' },
    'dry-run': { type: 'boolean', default: false },
  },
})

// ── Load files ────────────────────────────────────────────────────────────────

const stagingPath = join(ROOT, args.staging)
const bankPath    = join(ROOT, 'public/quiz-bank.json')
const constPath   = join(ROOT, 'lib/constants.ts')

if (!existsSync(stagingPath)) {
  console.error(`Staging file not found: ${args.staging}`)
  console.error('Run generate-d3-questions.mjs first.')
  process.exit(1)
}
const staged  = JSON.parse(readFileSync(stagingPath, 'utf8'))
const rawBank = JSON.parse(readFileSync(bankPath,    'utf8'))
const bank    = Array.isArray(rawBank) ? rawBank : Object.values(rawBank)

console.log(`Staging: ${staged.length} question(s)`)
console.log(`Bank:    ${bank.length} question(s)`)

// ── Deduplicate ───────────────────────────────────────────────────────────────

const existingIds = new Set(bank.map(q => q.id))
const toAdd = staged.filter(q => {
  if (existingIds.has(q.id)) {
    console.log(`  skip (duplicate id): ${q.id}`)
    return false
  }
  return true
})

if (toAdd.length === 0) {
  console.log('\nNo new questions to merge.')
  process.exit(0)
}

console.log(`\nNew questions to add: ${toAdd.length}`)
toAdd.forEach(q => console.log(`  + ${q.id}  [${q.type}, d${q.difficulty}]  ${q.concept_ids.join(', ')}`))

// ── Bump QUIZ_BANK_VERSION ────────────────────────────────────────────────────

const constSrc = readFileSync(constPath, 'utf8')
const versionMatch = constSrc.match(/QUIZ_BANK_VERSION\s*=\s*'(\d+)\.(\d+)\.(\d+)'/)
if (!versionMatch) {
  console.error('Could not find QUIZ_BANK_VERSION in lib/constants.ts')
  process.exit(1)
}

const [, major, minor, patch] = versionMatch
const oldVersion = `${major}.${minor}.${patch}`
const newVersion = `${major}.${minor}.${Number(patch) + 1}`

console.log(`\nVersion: ${oldVersion} → ${newVersion}`)

if (args['dry-run']) {
  console.log('\nDRY RUN — no files written.')
  process.exit(0)
}

// ── Write changes ─────────────────────────────────────────────────────────────

// Append to quiz-bank.json
const newBank = [...bank, ...toAdd]
writeFileSync(bankPath, JSON.stringify(newBank, null, 2), 'utf8')
console.log(`✓ quiz-bank.json updated (${bank.length} → ${newBank.length} questions)`)

// Bump version constant
const newConst = constSrc.replace(
  /QUIZ_BANK_VERSION\s*=\s*'[^']*'/,
  `QUIZ_BANK_VERSION = '${newVersion}'`,
)
writeFileSync(constPath, newConst, 'utf8')
console.log(`✓ lib/constants.ts: QUIZ_BANK_VERSION = '${newVersion}'`)

console.log('\nAll done. Commit these files:')
console.log('  git add public/quiz-bank.json lib/constants.ts')
console.log(`  git commit -m "content: add ${toAdd.length} difficulty-3 questions"`)
