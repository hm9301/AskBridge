'use client'

import { useState } from 'react'
import type { Question } from '@/app/api/analyze/route'

interface ResultCardProps {
  question: Question
  index: number
  selected?: boolean
  onToggle?: () => void
}

const DIFFICULTY_STYLE = {
  상: 'bg-red-100 text-red-600',
  중: 'bg-yellow-100 text-yellow-600',
  하: 'bg-green-100 text-green-600',
} as const

export default function ResultCard({ question, index, selected = true, onToggle }: ResultCardProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${selected ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
      <div className="flex items-stretch">
        {onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center px-3 border-r border-gray-100 hover:bg-gray-50 transition-colors flex-shrink-0"
            title={selected ? '선택 해제' : '선택'}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
              {selected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left p-5 flex items-start gap-4"
        >
        <span className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {question.difficulty && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[question.difficulty] ?? 'bg-gray-100 text-gray-500'}`}>
                난이도 {question.difficulty}
              </span>
            )}
          </div>
          <p className="text-gray-800 font-medium leading-relaxed">{question.question}</p>
        </div>
        <svg
          className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 space-y-3 border-t border-gray-50">
          {/* 왜 헷갈릴 수 있나요 */}
          <div className="flex gap-3 pt-4">
            <div className="flex-shrink-0 w-5 h-5 mt-0.5">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-1">왜 헷갈릴 수 있나요?</p>
              <p className="text-sm text-gray-600 leading-relaxed">{question.reason}</p>
            </div>
          </div>

          {/* 모범 답변 */}
          {question.answer && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-600 mb-1">모범 답변</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-lg px-3 py-2">
                  {question.answer}
                </p>
              </div>
            </div>
          )}

          {/* 출처 */}
          {(question.section || question.source) && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-600 mb-1">출처</p>
                {question.section && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      {question.section}
                    </span>
                  </div>
                )}
                {question.source && (
                  <blockquote className="text-sm text-gray-500 italic border-l-2 border-green-200 pl-3">
                    &ldquo;{question.source}&rdquo;
                  </blockquote>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
