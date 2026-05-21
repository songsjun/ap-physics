#!/usr/bin/env node
/**
 * generate-d3-questions.mjs
 *
 * Generates difficulty-3 AP Physics 1 quiz questions by calling an AI CLI.
 * Output goes to a STAGING file for human review before merging.
 *
 * Usage:
 *   node scripts/generate-d3-questions.mjs [options]
 *
 * Options:
 *   --cmd <cli>         AI CLI command that reads prompt from stdin
 *                       Default: "claude" (Claude Code CLI)
 *                       Examples: "gemini", "claude", "llm -m gpt-4o"
 *   --concept <id>      Generate for one specific concept only
 *   --type <type>       Question type: mcq | short  (default: mcq)
 *   --limit <n>         Max concepts to process in one run (default: 5)
 *   --out <file>        Staging output path (default: scripts/generated-questions.json)
 *   --dry-run           Print prompts without calling the CLI
 *
 * Workflow:
 *   1. Run this script (generates staging file)
 *   2. Review scripts/generated-questions.json  — edit/delete as needed
 *   3. Run: node scripts/merge-questions.mjs    — appends to quiz-bank.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Parse arguments ───────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    cmd:       { type: 'string',  default: 'claude' },
    concept:   { type: 'string' },
    type:      { type: 'string',  default: 'mcq' },
    limit:     { type: 'string',  default: '5' },
    out:       { type: 'string',  default: 'scripts/generated-questions.json' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: false,
})

if (!['mcq', 'short'].includes(args.type)) {
  console.error('--type must be mcq or short')
  process.exit(1)
}

// ── Load data ─────────────────────────────────────────────────────────────────

const contentLib  = JSON.parse(readFileSync(join(ROOT, 'data/content_library.json'), 'utf8'))
const rawBank     = JSON.parse(readFileSync(join(ROOT, 'public/quiz-bank.json'), 'utf8'))
const template    = readFileSync(join(__dirname, 'prompt-d3-template.txt'), 'utf8')

const concepts    = contentLib.concepts       // array of KnowledgePoint
const allQ        = Array.isArray(rawBank) ? rawBank : Object.values(rawBank)

// ── Find concepts needing d3 questions ───────────────────────────────────────

/** Map: concept_id → count of existing non-feynman d3 questions */
const d3Count = {}
allQ.filter(q => q.difficulty === 3 && q.type !== 'feynman').forEach(q => {
  q.concept_ids.forEach(cid => { d3Count[cid] = (d3Count[cid] ?? 0) + 1 })
})

let targets = concepts.filter(kp => (d3Count[kp.id] ?? 0) === 0)

if (args.concept) {
  const match = concepts.find(kp => kp.id === args.concept)
  if (!match) {
    console.error(`Concept not found: "${args.concept}"`)
    console.error('Available IDs:', concepts.map(k => k.id).join(', '))
    process.exit(1)
  }
  targets = [match]
} else {
  const limit = parseInt(args.limit, 10)
  targets = targets.slice(0, limit)
}

if (targets.length === 0) {
  console.log('All concepts already have difficulty-3 questions. Nothing to do.')
  process.exit(0)
}

// ── Load existing staging file ────────────────────────────────────────────────

const outPath = join(ROOT, args.out)
const staged  = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : []
const stagedIds = new Set(staged.map(q => q.id))

console.log(`\nTarget: ${targets.length} concepts | type: ${args.type} | cmd: ${args.cmd}`)
if (args['dry-run']) console.log('DRY RUN — no AI calls will be made\n')
console.log('─'.repeat(60))

// ── Build prompt helper ───────────────────────────────────────────────────────

function buildPrompt(kp, index) {
  const prereqs = (kp.prerequisites ?? []).join(', ') || 'none'
  const isMcq   = args.type === 'mcq'

  return template
    .replace(/{{CONCEPT_ID}}/g,       kp.id)
    .replace(/{{CONCEPT_NAME_ZH}}/g,  kp.name_zh)
    .replace(/{{CONCEPT_NAME_EN}}/g,  kp.name_en)
    .replace(/{{UNIT}}/g,             String(kp.unit))
    .replace(/{{CED_TOPIC}}/g,        kp.ced_topic ?? '')
    .replace(/{{CED_TOPIC_NAME}}/g,   kp.ced_topic_name ?? '')
    .replace(/{{PREREQUISITES}}/g,    prereqs)
    .replace(/{{TYPE}}/g,             args.type)
    .replace(/{{WEEK}}/g,             String(kp.week))
    .replace(/{{INDEX}}/g,            String(index))
    // Conditional blocks for MCQ vs short
    .replace(/{{#if_mcq}}([\s\S]*?){{\/if_mcq}}/g,   isMcq ? '$1' : '')
    .replace(/{{#if_short}}([\s\S]*?){{\/if_short}}/g, isMcq ? '' : '$1')
}

// ── Call AI CLI ───────────────────────────────────────────────────────────────

function callAI(prompt) {
  // Split cmd into executable + args (e.g., "llm -m gpt-4o" → ["llm", "-m", "gpt-4o"])
  const [exe, ...cliArgs] = args.cmd.split(/\s+/)

  const result = spawnSync(exe, cliArgs, {
    input: prompt,
    encoding: 'utf8',
    timeout: 90_000,     // 90s — generous for slow models
    maxBuffer: 1024 * 512,
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`CLI exited ${result.status}: ${(result.stderr ?? '').slice(0, 200)}`)
  }
  return result.stdout ?? ''
}

// ── Extract and validate JSON from AI response ────────────────────────────────

function parseQuestion(raw, kp) {
  // Grab the first {...} block in the response (handles markdown fences, preamble)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')

  const q = JSON.parse(match[0])

  // Schema validation
  const required = ['id', 'concept_ids', 'week', 'difficulty', 'type', 'question', 'answer', 'grading_rubric', 'explanation']
  for (const field of required) {
    if (q[field] === undefined) throw new Error(`Missing field: ${field}`)
  }
  if (q.difficulty !== 3) throw new Error(`difficulty must be 3, got ${q.difficulty}`)
  if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length !== 4)) {
    throw new Error('MCQ must have exactly 4 options')
  }
  if (!Array.isArray(q.concept_ids) || q.concept_ids.length === 0) {
    throw new Error('concept_ids must be a non-empty array')
  }

  // Ensure the target concept is included even if AI forgot
  if (!q.concept_ids.includes(kp.id)) {
    q.concept_ids.unshift(kp.id)
  }

  return q
}

// ── Main loop ─────────────────────────────────────────────────────────────────

let newCount = 0

for (const kp of targets) {
  const nextIndex = (d3Count[kp.id] ?? 0) + staged.filter(q => q.concept_ids?.includes(kp.id) && q.difficulty === 3).length + 1
  const prompt = buildPrompt(kp, nextIndex)

  process.stdout.write(`\n[${kp.id}]\n  ${kp.name_zh} (${kp.name_en})\n`)

  if (args['dry-run']) {
    console.log('  ── prompt preview (first 400 chars) ──')
    console.log(prompt.slice(0, 400) + '\n  ...')
    continue
  }

  let raw
  try {
    process.stdout.write('  Calling AI...')
    raw = callAI(prompt)
    process.stdout.write(' done\n')
  } catch (err) {
    console.error(`  ✗ CLI error: ${err.message.slice(0, 120)}`)
    continue
  }

  let q
  try {
    q = parseQuestion(raw, kp)
  } catch (err) {
    console.error(`  ✗ Parse/validate error: ${err.message}`)
    console.error('  Raw response:\n', raw.slice(0, 600))
    continue
  }

  if (stagedIds.has(q.id)) {
    console.log(`  ↩ Already staged: ${q.id}`)
    continue
  }

  staged.push(q)
  stagedIds.add(q.id)
  newCount++
  console.log(`  ✓ Staged: ${q.id}`)

  // Write after each question — safe against mid-run crashes
  writeFileSync(outPath, JSON.stringify(staged, null, 2), 'utf8')
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60))
console.log(`Done. ${newCount} new question(s) added → ${args.out}`)
console.log(`Staging total: ${staged.length} question(s)`)

if (!args['dry-run'] && newCount > 0) {
  console.log('\nNext steps:')
  console.log('  1. Review:  cat scripts/generated-questions.json')
  console.log('  2. Edit:    Fix any errors in the staging file')
  console.log('  3. Merge:   node scripts/merge-questions.mjs')
}
