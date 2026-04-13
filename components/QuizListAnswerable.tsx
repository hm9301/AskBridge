'use client'

import type { Quiz } from '@/app/api/analyze/route'
import QuizCardAnswerable from './QuizCardAnswerable'

interface QuizListAnswerableProps {
  quizzes: Quiz[]
}

export default function QuizListAnswerable({ quizzes }: QuizListAnswerableProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">총 {quizzes.length}개의 퀴즈 · 정답이 생각나면 버튼을 눌러 확인하세요</p>
      <div className="space-y-3">
        {quizzes.map((quiz, i) => (
          <QuizCardAnswerable key={i} quiz={quiz} index={i} />
        ))}
      </div>
    </div>
  )
}
