'use client'

import { useState } from 'react'
import type { Objective } from '@/app/api/analyze/route'
import { copyObjectivesToClipboard, downloadObjectivesAsMarkdown, downloadObjectivesAsHtml } from '@/lib/export'

interface ObjectiveListProps {
  objectives: Objective[]
  isStreaming?: boolean
  hideActions?: boolean
}

export default function ObjectiveList({ objectives, isStreaming, hideActions }: ObjectiveListProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyObjectivesToClipboard(objectives).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        {isStreaming
          ? `${objectives.length}개 도출 중...`
          : `총 ${objectives.length}개의 학습 목표`}
      </p>

      <div className="space-y-3">
        {objectives.map((obj, i) => (
          <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold leading-relaxed break-words">{obj.title}</p>
              {obj.description && (
                <p className="text-sm text-gray-500 mt-1 leading-relaxed break-words">{obj.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isStreaming && !hideActions && objectives.length > 0 && (
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
            onClick={() => downloadObjectivesAsMarkdown(objectives)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            MD 저장
          </button>
          <button
            onClick={() => downloadObjectivesAsHtml(objectives)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            HTML 저장
          </button>
        </div>
      )}

      {isStreaming && objectives.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
          <svg className="animate-spin w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-emerald-500 animate-pulse">분석을 이어가고 있습니다...</p>
        </div>
      )}
    </div>
  )
}
