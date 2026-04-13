'use client'

import { useState } from 'react'
import type { Quiz } from '@/app/api/analyze/route'

interface QuizCardAnswerableProps {
  quiz: Quiz
  index: number
}

const DIFFICULTY_STYLE: Record<string, string> = {
  '상': 'bg-red-50 text-red-500',
  '중': 'bg-yellow-50 text-yellow-600',
  '하': 'bg-green-50 text-green-600',
}

export default function QuizCardAnswerable({ quiz, index }: QuizCardAnswerableProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={`p-4 border rounded-xl transition-colors ${revealed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-gray-800 leading-relaxed font-medium">{quiz.sentence}</p>

          {quiz.difficulty && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_STYLE[quiz.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
              난이도 {quiz.difficulty}
            </span>
          )}

          {revealed ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-emerald-700 font-semibold">
                정답: <span>{quiz.answer}</span>
              </p>
              <button
                onClick={() => setRevealed(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                숨기기
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">힌트: {quiz.hint}</p>
              <button
                onClick={() => setRevealed(true)}
                className="ml-auto flex-shrink-0 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
              >
                정답 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
