'use client'

import { useState, useEffect } from 'react'
import InputSection from '@/components/InputSection'
import ResultList from '@/components/ResultList'
import QuizList from '@/components/QuizList'
import ObjectiveList from '@/components/ObjectiveList'
import type { Objective, Question, Quiz } from '@/app/api/analyze/route'
import { extractObjectivesFromBuffer, extractQuestionsFromBuffer, extractQuizzesFromBuffer } from '@/lib/streamParser'
import { saveHistory, loadHistory, deleteHistory, formatRelativeTime, type HistoryItem } from '@/lib/history'
import { encodeShareData } from '@/lib/share'
import type { ShareData } from '@/lib/share'

type AppState = 'idle' | 'streaming' | 'result' | 'error'
type ActiveTab = 'objectives' | 'questions' | 'quizzes'
type Level = '입문' | '기초' | '중급' | '심화'

const LEVELS: Level[] = ['입문', '기초', '중급', '심화']

export default function Home() {
  const [content, setContent] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [state, setState] = useState<AppState>('idle')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('objectives')
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<number>>(new Set())
  const [shareCopied, setShareCopied] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareInclude, setShareInclude] = useState({ objectives: true, questions: true, quizzes: true })
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printInclude, setPrintInclude] = useState({ objectives: true, questions: true, quizzes: true, quizzesNoAnswer: false })
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('수업 자료를 입력해주세요.')
      return
    }

    setState('streaming')
    setObjectives([])
    setQuestions([])
    setQuizzes([])
    setSelectedQuestions(new Set())
    setSelectedQuizzes(new Set())
    setActiveTab('objectives')
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, level }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('스트림을 읽을 수 없습니다.')

      const decoder = new TextDecoder()
      let buffer = ''
      let shownObj: Objective[] = []
      let shownQ: Question[] = []
      let shownQz: Quiz[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const errorMatch = buffer.match(/__ERROR__:(.+)/)
        if (errorMatch) throw new Error(errorMatch[1])

        const extractedObj = extractObjectivesFromBuffer(buffer)
        if (extractedObj.length > shownObj.length) {
          shownObj = extractedObj
          setObjectives([...shownObj])
        }

        const { questions: extractedQ } = extractQuestionsFromBuffer(buffer)
        if (extractedQ.length > shownQ.length) {
          shownQ = extractedQ
          setQuestions([...shownQ])
        }

        const extractedQz = extractQuizzesFromBuffer(buffer)
        if (extractedQz.length > shownQz.length) {
          shownQz = extractedQz
          setQuizzes([...shownQz])
        }
      }

      const finalObj = extractObjectivesFromBuffer(buffer)
      const { questions: finalQ } = extractQuestionsFromBuffer(buffer)
      const finalQz = extractQuizzesFromBuffer(buffer)

      const resultObj = finalObj.length > 0 ? finalObj : shownObj
      const resultQ = finalQ.length > 0 ? finalQ : shownQ
      const resultQz = finalQz.length > 0 ? finalQz : shownQz

      if (resultQ.length === 0) {
        throw new Error('질문을 생성하지 못했습니다. 다시 시도해주세요.')
      }

      setObjectives(resultObj)
      setQuestions(resultQ)
      setQuizzes(resultQz)
      setSelectedQuestions(new Set(resultQ.map((_, i) => i)))
      setSelectedQuizzes(new Set(resultQz.map((_, i) => i)))
      saveHistory(content, resultObj, resultQ, resultQz)
      setHistory(loadHistory())
      setState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      setState('error')
    }
  }

  const handleShare = () => {
    const pickedQ = questions.filter((_, i) => selectedQuestions.has(i))
    const pickedQz = quizzes.filter((_, i) => selectedQuizzes.has(i))
    const data: ShareData = {
      objectives: shareInclude.objectives ? objectives : [],
      ...(shareInclude.questions && pickedQ.length > 0 ? { questions: pickedQ } : {}),
      quizzes: shareInclude.quizzes ? pickedQz : [],
    }
    const encoded = encodeShareData(data)
    const url = `${window.location.origin}/share?d=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setShareModalOpen(false)
      setTimeout(() => setShareCopied(false), 2000)
    }).catch(() => {
      window.prompt('아래 링크를 복사하세요 (Ctrl+C)', url)
    })
  }

  const toggleQuestion = (i: number) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }
  const toggleAllQuestions = (selectAll: boolean) => {
    setSelectedQuestions(selectAll ? new Set(questions.map((_, i) => i)) : new Set())
  }
  const toggleQuiz = (i: number) => {
    setSelectedQuizzes(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }
  const toggleAllQuizzes = (selectAll: boolean) => {
    setSelectedQuizzes(selectAll ? new Set(quizzes.map((_, i) => i)) : new Set())
  }

  const handlePrint = () => {
    setPrintModalOpen(false)
    setTimeout(() => window.print(), 100)
  }

  const handleReset = () => {
    setState('idle')
    setObjectives([])
    setQuestions([])
    setQuizzes([])
    setError(null)
  }

  const handleLoadHistory = (item: HistoryItem) => {
    setObjectives(item.objectives ?? [])
    setQuestions(item.questions)
    setQuizzes(item.quizzes ?? [])
    setSelectedQuestions(new Set(item.questions.map((_, i) => i)))
    setSelectedQuizzes(new Set((item.quizzes ?? []).map((_, i) => i)))
    setActiveTab('objectives')
    setState('result')
    setError(null)
  }

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteHistory(id)
    setHistory(loadHistory())
  }

  const isStreaming = state === 'streaming'
  const showResults = (isStreaming && (objectives.length > 0 || questions.length > 0)) || state === 'result'

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <button onClick={handleReset} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 rounded-xl shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AskBridge</h1>
            <span className="text-sm text-gray-400 hidden sm:inline">· 수업 자료로 예상 질문 생성</span>
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="이전 분석 기록"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* 3단계 플로우 */}
        {!showResults && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center font-bold text-xs">1</span>
              수업 자료 업로드
            </span>
            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center font-bold text-xs">2</span>
              AI가 목표·질문·퀴즈 생성
            </span>
            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center font-bold text-xs">3</span>
              학생에게 링크 공유
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {showResults ? (
            <div className="space-y-4">
              {/* 분석 요약 */}
              {state === 'result' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-600 font-medium">
                    분석 완료 — 목표 {objectives.length}개, 질문 {questions.length}개, 퀴즈 {quizzes.length}개 생성됨
                  </p>
                </div>
              )}

              {/* 탭 헤더 */}
              <div className="space-y-2">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setActiveTab('objectives')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'objectives'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    학습 목표
                    {objectives.length > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                        {objectives.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'questions'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    예상 질문
                    {questions.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {questions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      activeTab === 'quizzes'
                        ? 'bg-white text-violet-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    단답형 퀴즈
                    {quizzes.length > 0 && (
                      <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
                        {quizzes.length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {state === 'result' && (
                    <button
                      onClick={() => setPrintModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      인쇄
                    </button>
                  )}
                  {state === 'result' && (
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      {shareCopied ? (
                        <>
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          링크 공유
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    disabled={isStreaming}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    초기화면
                  </button>
                </div>
              </div>

              {/* 탭 콘텐츠 */}
              {activeTab === 'objectives' ? (
                <ObjectiveList objectives={objectives} isStreaming={isStreaming} />
              ) : activeTab === 'questions' ? (
                <ResultList
                  questions={questions}
                  quizzes={quizzes}
                  isStreaming={isStreaming}
                  onReset={handleReset}
                  selectedQuestions={selectedQuestions}
                  onToggleQuestion={toggleQuestion}
                  onToggleAllQuestions={toggleAllQuestions}
                />
              ) : (
                <QuizList
                  quizzes={quizzes}
                  isStreaming={isStreaming}
                  selectedQuizzes={selectedQuizzes}
                  onToggleQuiz={toggleQuiz}
                  onToggleAllQuizzes={toggleAllQuizzes}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <InputSection
                content={content}
                onChange={(v) => {
                  setContent(v)
                  if (state === 'error') setError(null)
                }}
                isLoading={isStreaming}
              />

              {/* 대상 수준 선택 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">대상 수준 <span className="text-gray-300 font-normal">(선택)</span></p>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(level === l ? null : l)}
                      disabled={isStreaming}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        level === l
                          ? 'bg-blue-600 border-blue-600 text-white font-medium'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-600">{error}</p>
                    {state === 'error' && content.trim() && (
                      <button
                        onClick={handleAnalyze}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        다시 시도
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isStreaming || !content.trim()}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center gap-3"
              >
                {isStreaming ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    예상 질문 + 퀴즈 생성하기
                  </>
                )}
              </button>

              {isStreaming && (
                <p className="text-center text-sm text-gray-400 animate-pulse">
                  수업 자료를 분석하고 있습니다...
                </p>
              )}
            </div>
          )}
        </div>

        {/* 히스토리 드로어 backdrop */}
        {historyOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setHistoryOpen(false)}
          />
        )}

        {/* 히스토리 드로어 */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">이전 분석 기록</h3>
            <button
              onClick={() => setHistoryOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">기록이 없습니다</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { handleLoadHistory(item); setHistoryOpen(false) }}
                  className="cursor-pointer bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:bg-blue-50 transition-all group flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 group-hover:border-blue-200">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.preview || '(내용 없음)'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(item.createdAt)} · 질문 {item.questions.length}개 · 퀴즈 {(item.quizzes ?? []).length}개
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all flex-shrink-0"
                    title="삭제"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 공유링크 모달 */}
        {shareModalOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShareModalOpen(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full max-w-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">공유 링크 만들기</h3>
                <p className="text-xs text-gray-400 mb-4">포함할 섹션을 선택하세요</p>
                <div className="space-y-3 mb-5">
                  {objectives.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareInclude.objectives}
                        onChange={e => setShareInclude(s => ({ ...s, objectives: e.target.checked }))}
                        className="w-4 h-4 rounded accent-emerald-500"
                      />
                      <span className="text-sm text-emerald-700 font-medium">학습 목표</span>
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">{objectives.length}개</span>
                    </label>
                  )}
                  {questions.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareInclude.questions}
                        onChange={e => setShareInclude(s => ({ ...s, questions: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="text-sm text-blue-700 font-medium">예상 질문</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-auto">{questions.length}개</span>
                    </label>
                  )}
                  {quizzes.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareInclude.quizzes}
                        onChange={e => setShareInclude(s => ({ ...s, quizzes: e.target.checked }))}
                        className="w-4 h-4 rounded accent-violet-500"
                      />
                      <span className="text-sm text-violet-700 font-medium">단답형 퀴즈</span>
                      <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full ml-auto">{quizzes.length}개</span>
                    </label>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!shareInclude.objectives && !shareInclude.questions && !shareInclude.quizzes}
                    className="flex-1 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                  >
                    링크 복사
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 인쇄 전용 영역 (화면에서는 숨김) */}
        <div id="print-area" style={{ display: 'none' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>AskBridge 학습 자료</h1>
          {printInclude.objectives && objectives.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>학습 목표</h2>
              {objectives.map((obj, i) => (
                <div key={i} style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontWeight: '700', marginBottom: '0.4rem' }}>{i + 1}. {obj.title}</p>
                  {obj.description && <p style={{ color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>{obj.description}</p>}
                </div>
              ))}
            </div>
          )}
          {printInclude.questions && questions.filter((_, i) => selectedQuestions.has(i)).length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>예상 질문</h2>
              {questions.filter((_, i) => selectedQuestions.has(i)).map((q, i) => (
                <div key={i} style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontWeight: '700', marginBottom: '0.4rem' }}>{i + 1}. {q.question}</p>
                  {q.answer && <p style={{ color: '#374151', marginLeft: '1rem', marginTop: '0.3rem', fontSize: '0.875rem' }}><span style={{ fontWeight: '600' }}>모범 답안:</span> {q.answer}</p>}
                  {q.reason && <p style={{ color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem', fontSize: '0.8rem' }}><span style={{ fontWeight: '600' }}>출제 이유:</span> {q.reason}</p>}
                  {q.difficulty && <p style={{ color: '#9ca3af', marginLeft: '1rem', marginTop: '0.2rem', fontSize: '0.8rem' }}>난이도: {q.difficulty}</p>}
                </div>
              ))}
            </div>
          )}
          {printInclude.quizzes && quizzes.filter((_, i) => selectedQuizzes.has(i)).length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>단답형 퀴즈</h2>
              {quizzes.filter((_, i) => selectedQuizzes.has(i)).map((q, i) => (
                <div key={i} style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontWeight: '700', marginBottom: '0.4rem' }}>{i + 1}. {q.sentence.replace('___', '________')}</p>
                  <p style={{ color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>정답: {q.answer}</p>
                </div>
              ))}
            </div>
          )}
          {printInclude.quizzesNoAnswer && quizzes.filter((_, i) => selectedQuizzes.has(i)).length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>단답형 퀴즈 (정답 제외)</h2>
              {quizzes.filter((_, i) => selectedQuizzes.has(i)).map((q, i) => (
                <div key={i} style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontWeight: '700' }}>{i + 1}. {q.sentence.replace('___', '________')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 인쇄 모달 */}
        {printModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPrintModalOpen(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full max-w-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">인쇄 설정</h3>
                <p className="text-xs text-gray-400 mb-4">인쇄할 섹션을 선택하세요</p>
                <div className="space-y-3 mb-5">
                  {objectives.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printInclude.objectives}
                        onChange={e => setPrintInclude(s => ({ ...s, objectives: e.target.checked }))}
                        className="w-4 h-4 rounded accent-emerald-500"
                      />
                      <span className="text-sm text-emerald-700 font-medium">학습 목표</span>
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">{objectives.length}개</span>
                    </label>
                  )}
                  {questions.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printInclude.questions}
                        onChange={e => setPrintInclude(s => ({ ...s, questions: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="text-sm text-blue-700 font-medium">예상 질문</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-auto">{questions.length}개</span>
                    </label>
                  )}
                  {quizzes.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printInclude.quizzes}
                        onChange={e => setPrintInclude(s => ({ ...s, quizzes: e.target.checked }))}
                        className="w-4 h-4 rounded accent-violet-500"
                      />
                      <span className="text-sm text-violet-700 font-medium">단답형 퀴즈</span>
                      <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full ml-auto">{quizzes.length}개</span>
                    </label>
                  )}
                  {quizzes.length > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printInclude.quizzesNoAnswer}
                        onChange={e => setPrintInclude(s => ({ ...s, quizzesNoAnswer: e.target.checked }))}
                        className="w-4 h-4 rounded accent-violet-300"
                      />
                      <span className="text-sm text-violet-500 font-medium">단답형 퀴즈 <span className="text-xs font-normal">(정답 제외)</span></span>
                      <span className="text-xs text-violet-400 bg-violet-50 px-2 py-0.5 rounded-full ml-auto">{quizzes.length}개</span>
                    </label>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrintModalOpen(false)}
                    className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={!printInclude.objectives && !printInclude.questions && !printInclude.quizzes && !printInclude.quizzesNoAnswer}
                    className="flex-1 py-2 text-sm text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    인쇄
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-2">
          © KongMu
        </p>
      </div>
    </main>
  )
}
