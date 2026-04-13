import LZString from 'lz-string'
import type { Objective, Question, Quiz } from '@/app/api/analyze/route'

export interface ShareData {
  objectives: Objective[]
  questions?: Question[]
  quizzes: Quiz[]
}

export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeShareData(encoded: string): ShareData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    return JSON.parse(json) as ShareData
  } catch {
    return null
  }
}
