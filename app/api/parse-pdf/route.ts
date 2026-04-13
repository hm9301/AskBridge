import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF는 지원하지 않습니다.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: data.text.trim() })
  } catch (error) {
    console.error('PDF parse error:', error)
    return NextResponse.json(
      { error: 'PDF 파일을 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
