import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const LEVEL_CONTEXT: Record<string, string> = {
  입문: '해당 분야를 처음 접하는 학습자입니다. 전문 용어를 최소화하고 쉬운 비유와 예시 위주로 설명하세요.',
  기초: '기본 개념을 익히는 단계의 학습자입니다. 핵심 용어는 설명을 곁들여 사용하세요.',
  중급: '기초 지식을 갖춘 학습자입니다. 전문 용어를 자유롭게 사용하고 개념 간 연결을 중시하세요.',
  심화: '해당 분야에 충분한 지식을 가진 학습자입니다. 깊이 있는 내용과 엣지 케이스까지 다루세요.',
}

function buildSystemPrompt(level?: string): string {
  const levelLine = level && LEVEL_CONTEXT[level]
    ? `\n${LEVEL_CONTEXT[level]}\n`
    : ''

  return `당신은 10년 경력의 교육 전문가입니다. 강사가 제공한 수업 자료를 분석하여 세 가지 결과물을 생성합니다.${levelLine}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "objectives": [
    {
      "title": "학습 목표 제목 (동사형으로 간결하게, 예: '프로세스와 스레드의 차이를 설명할 수 있다')",
      "description": "이 목표가 중요한 이유 또는 실제 적용 맥락 (1~2문장)"
    }
  ],
  "questions": [
    {
      "question": "학생이 가질 법한 질문",
      "reason": "왜 이 부분이 헷갈릴 수 있는지 설명",
      "answer": "강사 입장에서 이 질문에 대한 모범 답변 (학생이 이해하기 쉽게 핵심만 간결하게)",
      "difficulty": "상 | 중 | 하 (학생이 이 질문을 이해하거나 답하기 얼마나 어려운지)",
      "section": "해당 내용이 속한 대제목 또는 소제목, 수업 자료에 번호가 있으면 번호 포함 (예: '1. 프로세스란?', '2.3 문맥 교환') (수업 자료에 제목이 없으면 null)",
      "source": "수업 자료에서 해당 내용이 나온 부분을 직접 인용 (30자 이내)"
    }
  ],
  "quizzes": [
    {
      "sentence": "핵심 개념이 들어간 문장에서 중요한 단어나 구를 ___로 대체한 빈칸 문장",
      "answer": "빈칸에 들어갈 정답 단어 또는 구",
      "hint": "정답을 떠올릴 수 있도록 돕는 힌트 (정답을 직접 노출하지 말 것)",
      "difficulty": "상 | 중 | 하"
    }
  ]
}

objectives는 3~5개 생성하세요. 이 수업을 마친 후 학생이 반드시 이해하거나 수행할 수 있어야 하는 핵심 학습 목표를 작성하세요.
questions는 최소 3개, 최대 7개 생성하세요.
quizzes는 최소 3개, 최대 7개 생성하세요. 빈칸(___) 안에 들어갈 정답은 반드시 수업 자료에 등장하는 핵심 용어여야 합니다.`
}

export interface Objective {
  title: string
  description: string
}

export interface Question {
  question: string
  reason: string
  answer: string
  difficulty: '상' | '중' | '하'
  section: string | null
  source: string
}

export interface Quiz {
  sentence: string
  answer: string
  hint: string
  difficulty: '상' | '중' | '하'
}

export interface AnalyzeResponse {
  objectives: Objective[]
  questions: Question[]
  quizzes: Quiz[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, level } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '수업 자료를 입력해주세요.' }, { status: 400 })
    }

    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: '수업 자료가 너무 짧습니다. 더 많은 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(level),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `다음 수업 자료를 분석하여 학생들의 예상 질문을 생성해주세요:\n\n${content}`,
        },
      ],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          const final = await stream.finalMessage()
          if (final.stop_reason === 'max_tokens') {
            controller.enqueue(encoder.encode('\n__ERROR__:응답이 너무 깁니다. 수업 자료를 더 짧게 입력해주세요.'))
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : '오류가 발생했습니다.'
          controller.enqueue(encoder.encode('\n__ERROR__:' + msg))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json({ error: 'API 키가 유효하지 않습니다.' }, { status: 401 })
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
