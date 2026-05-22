// scripts/shuffle-mcq-answers.mjs
// Shuffles MCQ option order so correct answers are distributed across A/B/C/D positions.
// d3_mcqs.json format: top-level array, options are ["A. text", "B. text", "C. text", "D. text"],
// answer field is a letter like "A".

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function shuffleMCQAnswers(inputPath, outputPath) {
  const raw = readFileSync(inputPath, 'utf-8')
  const data = JSON.parse(raw)

  const questions = Array.isArray(data) ? data : data.questions
  const letters = ['A', 'B', 'C', 'D']

  // Build target distribution: 47 questions, each letter appears ~11-12 times
  // Spread evenly then shuffle to avoid sequential patterns
  const targetLetters = []
  for (let i = 0; i < questions.length; i++) {
    targetLetters.push(letters[i % 4])
  }
  fisherYates(targetLetters)

  const beforeDist = { A: 0, B: 0, C: 0, D: 0 }
  const afterDist = { A: 0, B: 0, C: 0, D: 0 }

  const result = questions.map((q, idx) => {
    const currentAnswerLetter = q.answer.trim().toUpperCase() // e.g. "A"
    beforeDist[currentAnswerLetter]++

    // Extract the text content of each option (strip "A. ", "B. " prefix)
    const optionMap = {}
    for (const opt of q.options) {
      const letter = opt[0].toUpperCase()  // "A", "B", "C", "D"
      const text = opt.slice(3)            // everything after "X. "
      optionMap[letter] = text
    }

    // Text of the correct answer
    const correctText = optionMap[currentAnswerLetter]

    // Get all option texts and shuffle them
    const optionTexts = letters.map(l => optionMap[l])
    fisherYates(optionTexts)

    // Force the correct answer into the target position for this question
    const targetLetter = targetLetters[idx]
    const targetIdx = letters.indexOf(targetLetter)
    const currentCorrectIdx = optionTexts.indexOf(correctText)

    // Swap so correct answer lands at targetIdx
    ;[optionTexts[targetIdx], optionTexts[currentCorrectIdx]] = [
      optionTexts[currentCorrectIdx],
      optionTexts[targetIdx],
    ]

    // Rebuild options array with proper letter prefixes
    const newOptions = optionTexts.map((text, i) => `${letters[i]}. ${text}`)
    const newAnswer = targetLetter

    afterDist[newAnswer]++

    return {
      ...q,
      options: newOptions,
      answer: newAnswer,
    }
  })

  console.log('处理前答案分布:', beforeDist)
  console.log('处理后答案分布:', afterDist)
  console.log()
  console.log('前3题变化对比:')
  for (let i = 0; i < 3; i++) {
    const orig = questions[i]
    const updated = result[i]
    console.log(`\n题目 ${i + 1}: ${orig.id}`)
    console.log('  原始: answer=${orig.answer}')
    console.log('    ', orig.options.join(' | '))
    console.log(`  更新: answer=${updated.answer}`)
    console.log('    ', updated.options.join(' | '))
  }

  const output = Array.isArray(data) ? result : { ...data, questions: result }
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n处理完成，共 ${result.length} 道题，已写入: ${outputPath}`)
}

const dataPath = resolve(__dirname, '../data/d3_mcqs.json')
shuffleMCQAnswers(dataPath, dataPath)
