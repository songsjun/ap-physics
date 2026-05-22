import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filePath = resolve(__dirname, '../data/d3_mcqs.json')

const data = JSON.parse(readFileSync(filePath, 'utf-8'))
const questions = Array.isArray(data) ? data : (data.questions || [])

let fixedCount = 0
const fixed = questions.map(q => {
  if (q.answer === 'A') return q  // A是正确答案的题无需修改

  const answerLetter = q.answer  // B, C, or D
  let newExplanation = q.explanation

  // 替换各种"A正确"写法（按文件实际格式，仅需替换 A正确）
  newExplanation = newExplanation
    .replace(/A正确/g, `${answerLetter}正确`)
    .replace(/选A(?![A-Za-z0-9])/g, `选${answerLetter}`)
    .replace(/答案是A(?![A-Za-z0-9])/g, `答案是${answerLetter}`)
    .replace(/答案为A(?![A-Za-z0-9])/g, `答案为${answerLetter}`)
    .replace(/答案A(?![A-Za-z0-9])/g, `答案${answerLetter}`)

  if (newExplanation !== q.explanation) fixedCount++

  return { ...q, explanation: newExplanation }
})

const output = Array.isArray(data) ? fixed : { ...data, questions: fixed }
writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`修复了 ${fixedCount} 道题的 explanation 字段`)

// 验证：打印 answer 不是A但explanation仍含"A正确"的题
const remaining = fixed.filter(q =>
  q.answer !== 'A' && q.explanation.includes('A正确')
)
if (remaining.length > 0) {
  console.warn(`仍有 ${remaining.length} 道题未完全修复:`)
  remaining.forEach(q => console.warn(`  ${q.id}: answer=${q.answer}, explanation片段=${q.explanation.slice(-50)}`))
} else {
  console.log('验证通过：所有 answer!=A 的题不再含有"A正确"')
}
