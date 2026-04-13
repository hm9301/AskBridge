import type { Objective, Question, Quiz } from '@/app/api/analyze/route'

/**
 * 버퍼에서 특정 배열 키 아래의 완성된 객체들을 순서대로 추출합니다.
 */
function extractArrayFromBuffer<T extends object>(buffer: string, key: string): T[] {
  const results: T[] = []

  const arrayMatch = buffer.match(new RegExp(`"${key}"\\s*:\\s*\\[`))
  if (!arrayMatch || arrayMatch.index === undefined) return results

  let pos = arrayMatch.index + arrayMatch[0].length

  while (pos < buffer.length) {
    while (pos < buffer.length && /[\s,]/.test(buffer[pos])) pos++

    if (buffer[pos] !== '{') break

    let depth = 0
    let inString = false
    let escape = false
    let end = -1

    for (let i = pos; i < buffer.length; i++) {
      const c = buffer[i]
      if (escape) { escape = false; continue }
      if (c === '\\' && inString) { escape = true; continue }
      if (c === '"') { inString = !inString; continue }
      if (inString) continue
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }

    if (end === -1) break

    try {
      const obj = JSON.parse(buffer.slice(pos, end + 1)) as T
      results.push(obj)
    } catch {
      break
    }

    pos = end + 1
  }

  return results
}

export function extractObjectivesFromBuffer(buffer: string): Objective[] {
  return extractArrayFromBuffer<Objective>(buffer, 'objectives')
}

export function extractQuestionsFromBuffer(buffer: string): {
  questions: Question[]
  remaining: string
} {
  return {
    questions: extractArrayFromBuffer<Question>(buffer, 'questions'),
    remaining: buffer,
  }
}

export function extractQuizzesFromBuffer(buffer: string): Quiz[] {
  return extractArrayFromBuffer<Quiz>(buffer, 'quizzes')
}
