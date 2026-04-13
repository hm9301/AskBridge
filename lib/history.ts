import type { Objective, Question, Quiz } from '@/app/api/analyze/route'

const STORAGE_KEY = 'askbridge_history'
const MAX_ITEMS = 10

export interface HistoryItem {
  id: string
  createdAt: string
  preview: string
  objectives: Objective[]
  questions: Question[]
  quizzes: Quiz[]
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: HistoryItem[] = JSON.parse(raw)
    const valid = items.filter((h) => Array.isArray(h.questions) && h.questions.length > 0)
    if (valid.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
    }
    return valid
  } catch {
    return []
  }
}

export function saveHistory(content: string, objectives: Objective[], questions: Question[], quizzes: Quiz[]): void {
  try {
    const history = loadHistory()
    const item: HistoryItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      preview: content.trim().split('\n')[0].slice(0, 50),
      objectives,
      questions,
      quizzes,
    }
    const updated = [item, ...history].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage 접근 불가 시 무시
  }
}

export function deleteHistory(id: string): void {
  try {
    const history = loadHistory().filter((h) => h.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}
