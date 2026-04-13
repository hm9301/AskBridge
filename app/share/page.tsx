'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeShareData, type ShareData } from '@/lib/share'
import ObjectiveList from '@/components/ObjectiveList'
import QuizListAnswerable from '@/components/QuizListAnswerable'
import ResultCard from '@/components/ResultCard'

type ActiveTab = 'objectives' | 'questions' | 'quizzes'

function ShareContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<ShareData | null>(null)
  const [invalid, setInvalid] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('objectives')

  useEffect(() => {
    const encoded = searchParams.get('d')
    if (!encoded) { setInvalid(true); return }
    const decoded = decodeShareData(encoded)
    if (!decoded) { setInvalid(true); return }
    setData(decoded)
    setInvalid(false)
    // 초기 탭: 있는 섹션 중 첫 번째
    if (decoded.objectives && decoded.objectives.length > 0) setActiveTab('objectives')
    else if (decoded.questions && decoded.questions.length > 0) setActiveTab('questions')
    else setActiveTab('quizzes')
  }, [searchParams])

  const hasObjectives = (data?.objectives?.length ?? 0) > 0
  const hasQuestions = (data?.questions?.length ?? 0) > 0
  const hasQuizzes = (data?.quizzes?.length ?? 0) > 0
  const tabCount = [hasObjectives, hasQuestions, hasQuizzes].filter(Boolean).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-xl shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">AskBridge</h1>
          <span className="text-sm text-gray-400 hidden sm:inline">· 수업 자료 학습 도우미</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {invalid === null ? (
            <div className="py-12" />
          ) : invalid ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">유효하지 않은 링크입니다.</p>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 탭 — 2개 이상일 때만 표시 */}
              {tabCount > 1 && (
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {hasObjectives && (
                    <button
                      onClick={() => setActiveTab('objectives')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                        activeTab === 'objectives'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      학습 목표
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                        {data.objectives.length}
                      </span>
                    </button>
                  )}
                  {hasQuestions && (
                    <button
                      onClick={() => setActiveTab('questions')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                        activeTab === 'questions'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      예상 질문
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {data.questions!.length}
                      </span>
                    </button>
                  )}
                  {hasQuizzes && (
                    <button
                      onClick={() => setActiveTab('quizzes')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                        activeTab === 'quizzes'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      단답형 퀴즈
                      <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
                        {data.quizzes.length}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* 탭 콘텐츠 */}
              {activeTab === 'objectives' && hasObjectives ? (
                <ObjectiveList objectives={data.objectives} hideActions />
              ) : activeTab === 'questions' && hasQuestions ? (
                <div className="space-y-3">
                  {data.questions!.map((q, i) => (
                    <ResultCard key={q.question} question={q} index={i} />
                  ))}
                </div>
              ) : hasQuizzes ? (
                <QuizListAnswerable quizzes={data.quizzes} />
              ) : null}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© KongMu</p>
      </div>
    </main>
  )
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareContent />
    </Suspense>
  )
}
