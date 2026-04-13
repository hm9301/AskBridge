'use client'

import { useState } from 'react'
import QuizCard from './QuizCard'
import type { Quiz } from '@/app/api/analyze/route'
import { copyQuizzesToClipboard, downloadQuizzesAsMarkdown, downloadQuizzesAsHtml } from '@/lib/export'

type DifficultyFilter = '전체' | '상' | '중' | '하'

interface QuizListProps {
  quizzes: Quiz[]
  isStreaming?: boolean
  selectedQuizzes?: Set<number>
  onToggleQuiz?: (i: number) => void
  onToggleAllQuizzes?: (selectAll: boolean) => void
}

export default function QuizList({ quizzes, isStreaming, selectedQuizzes, onToggleQuiz, onToggleAllQuizzes }: QuizListProps) {
  const [copied, setCopied] = useState(false)
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>('전체')

  const filtered = diffFilter === '전체' ? quizzes : quizzes.filter(q => q.difficulty === diffFilter)
  const selected = selectedQuizzes ? quizzes.filter((_, i) => selectedQuizzes.has(i)) : quizzes
  const allSelected = selectedQuizzes ? quizzes.every((_, i) => selectedQuizzes.has(i)) : true

  const handleCopy = async () => {
    try {
      await copyQuizzesToClipboard(selected.filter(q => filtered.includes(q)))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('클립보드 복사에 실패했습니다.')
    }
  }

  const difficultyColors: Record<DifficultyFilter, string> = {
    '전체': 'bg-gray-800 text-white',
    '상': 'bg-red-500 text-white',
    '중': 'bg-yellow-500 text-white',
    '하': 'bg-green-500 text-white',
  }
  const difficultyInactive: Record<DifficultyFilter, string> = {
    '전체': 'bg-gray-100 text-gray-500 hover:bg-gray-200',
    '상': 'bg-red-50 text-red-400 hover:bg-red-100',
    '중': 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100',
    '하': 'bg-green-50 text-green-500 hover:bg-green-100',
  }

  if (isStreaming && quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <svg className="animate-spin w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">퀴즈를 생성하고 있습니다...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">
            {isStreaming
              ? `${quizzes.length}개 생성 중...`
              : filtered.length === quizzes.length
                ? `총 ${quizzes.length}개`
                : `${filtered.length} / ${quizzes.length}개`}
          </p>
          {!isStreaming && onToggleAllQuizzes && (
            <button
              onClick={() => onToggleAllQuizzes(!allSelected)}
              className="text-xs text-violet-500 hover:text-violet-700 transition-colors"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          )}
          {!isStreaming && selectedQuizzes && selected.length < quizzes.length && (
            <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{selected.length}개 선택됨</span>
          )}
        </div>
        {!isStreaming && quizzes.length > 0 && (
          <div className="flex gap-1">
            {(['전체', '상', '중', '하'] as DifficultyFilter[]).map(level => (
              <button
                key={level}
                onClick={() => setDiffFilter(level)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  diffFilter === level ? difficultyColors[level] : difficultyInactive[level]
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">해당 난이도의 퀴즈가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const i = quizzes.indexOf(q)
            return (
              <QuizCard
                key={q.sentence}
                quiz={q}
                index={i}
                selected={selectedQuizzes ? selectedQuizzes.has(i) : true}
                onToggle={onToggleQuiz ? () => onToggleQuiz(i) : undefined}
              />
            )
          })}
        </div>
      )}

      {isStreaming && quizzes.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl">
          <svg className="animate-spin w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-indigo-500 animate-pulse">추가 퀴즈를 생성하고 있습니다...</p>
        </div>
      )}

      {!isStreaming && quizzes.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복사 완료
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                복사
              </>
            )}
          </button>
          <button
            onClick={() => downloadQuizzesAsMarkdown(selected)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            MD 저장
          </button>
          <button
            onClick={() => downloadQuizzesAsHtml(selected)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            HTML 저장
          </button>
        </div>
      )}
    </div>
  )
}
