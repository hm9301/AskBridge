'use client'

import { useState } from 'react'
import type { Quiz } from '@/app/api/analyze/route'

interface QuizCardProps {
  quiz: Quiz
  index: number
  selected?: boolean
  onToggle?: () => void
}

const DIFFICULTY_STYLE = {
  상: 'bg-red-100 text-red-600',
  중: 'bg-yellow-100 text-yellow-600',
  하: 'bg-green-100 text-green-600',
} as const

export default function QuizCard({ quiz, index, selected = true, onToggle }: QuizCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)

  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden ${!selected ? 'opacity-50' : ''}`}>
      <div className="flex items-stretch">
        {onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center px-3 border-r border-gray-100 hover:bg-gray-50 transition-colors flex-shrink-0"
            title={selected ? '선택 해제' : '선택'}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
              {selected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )}
      <div className="p-5 flex-1">
        {/* 번호 + 난이도 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {index + 1}
          </span>
          {quiz.difficulty && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[quiz.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
              난이도 {quiz.difficulty}
            </span>
          )}
        </div>

        {/* 빈칸 문장 */}
        <p className="text-gray-800 font-medium leading-relaxed text-base">
          {quiz.sentence.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block mx-1 px-3 py-0.5 bg-violet-50 border-b-2 border-violet-300 text-violet-300 rounded text-sm min-w-[4rem] text-center">
                  {showAnswer ? <span className="text-violet-600 font-bold">{quiz.answer}</span> : '???'}
                </span>
              )}
            </span>
          ))}
        </p>

        {/* 버튼 영역 */}
        <div className="flex gap-2 mt-4">
          {!showHint && !showAnswer && (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              힌트 보기
            </button>
          )}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showAnswer
                ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                : 'text-violet-600 bg-violet-50 hover:bg-violet-100'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showAnswer
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              }
            </svg>
            {showAnswer ? '정답 숨기기' : '정답 보기'}
          </button>
        </div>

        {/* 힌트 */}
        {showHint && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm text-amber-700">{quiz.hint}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
