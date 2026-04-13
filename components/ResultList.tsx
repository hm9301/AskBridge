'use client'

import { useState } from 'react'
import ResultCard from './ResultCard'
import type { Question, Quiz } from '@/app/api/analyze/route'
import { copyToClipboard, downloadAsMarkdown, downloadQuestionsAsHtml } from '@/lib/export'

type DifficultyFilter = '전체' | '상' | '중' | '하'

interface ResultListProps {
  questions: Question[]
  quizzes?: Quiz[]
  isStreaming?: boolean
  onReset: () => void
  selectedQuestions?: Set<number>
  onToggleQuestion?: (i: number) => void
  onToggleAllQuestions?: (selectAll: boolean) => void
}

export default function ResultList({ questions, quizzes = [], isStreaming, onReset, selectedQuestions, onToggleQuestion, onToggleAllQuestions }: ResultListProps) {
  const [copied, setCopied] = useState(false)
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>('전체')

  const filtered = diffFilter === '전체' ? questions : questions.filter(q => q.difficulty === diffFilter)
  const selected = selectedQuestions ? questions.filter((_, i) => selectedQuestions.has(i)) : questions
  const allSelected = selectedQuestions ? questions.every((_, i) => selectedQuestions.has(i)) : true

  const handleCopy = async () => {
    try {
      await copyToClipboard(selected.filter(q => filtered.includes(q)))
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">
            {isStreaming
              ? `${questions.length}개 생성 중...`
              : filtered.length === questions.length
                ? `총 ${questions.length}개`
                : `${filtered.length} / ${questions.length}개`}
          </p>
          {!isStreaming && onToggleAllQuestions && (
            <button
              onClick={() => onToggleAllQuestions(!allSelected)}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              {allSelected ? '전체 해제' : `전체 선택`}
            </button>
          )}
          {!isStreaming && selectedQuestions && selected.length < questions.length && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selected.length}개 선택됨</span>
          )}
        </div>
        {!isStreaming && questions.length > 0 && (
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
          <p className="text-sm">해당 난이도의 질문이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const i = questions.indexOf(q)
            return (
              <ResultCard
                key={q.question}
                question={q}
                index={i}
                selected={selectedQuestions ? selectedQuestions.has(i) : true}
                onToggle={onToggleQuestion ? () => onToggleQuestion(i) : undefined}
              />
            )
          })}
        </div>
      )}

      {isStreaming && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl">
          <svg className="animate-spin w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-blue-500 animate-pulse">추가 질문을 생성하고 있습니다...</p>
        </div>
      )}

      {!isStreaming && questions.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복사 완료
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                클립보드 복사
              </>
            )}
          </button>
          <button
            onClick={() => downloadAsMarkdown(selected, quizzes)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            MD 저장
          </button>
          <button
            onClick={() => downloadQuestionsAsHtml(selected)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            HTML 저장
          </button>
        </div>
      )}
    </div>
  )
}
