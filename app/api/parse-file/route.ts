import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

type SupportedServerType = 'pdf' | 'pptx' | 'docx'

function getServerFileType(file: File): SupportedServerType | null {
  if (file.name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (file.name.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx'
  if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return null
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text.trim()
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

async function parsePptx(buffer: Buffer): Promise<string> {
  const unzipper = await import('unzipper')

  const zip = await unzipper.Open.buffer(buffer)

  // 슬라이드 파일만 추출 (ppt/slides/slide1.xml, slide2.xml, ...)
  const slideFiles = zip.files.filter((f) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(f.path)
  )

  // 슬라이드 번호 순 정렬
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.path.match(/\d+/)?.[0] ?? '0')
    const numB = parseInt(b.path.match(/\d+/)?.[0] ?? '0')
    return numA - numB
  })

  const slideTexts: string[] = []
  for (const file of slideFiles) {
    const content = await file.buffer()
    const xml = content.toString('utf-8')
    // <a:t> 태그 안의 텍스트 추출
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
    const text = matches
      .map((m) => m.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
    if (text.trim()) slideTexts.push(text)
  }

  return slideTexts.join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
    }

    const fileType = getServerFileType(file)
    if (!fileType) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text = ''

    if (fileType === 'pdf') {
      text = await parsePdf(buffer)
    } else if (fileType === 'docx') {
      text = await parseDocx(buffer)
    } else if (fileType === 'pptx') {
      text = await parsePptx(buffer)
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: '파일에서 텍스트를 추출할 수 없습니다. 이미지 기반 파일은 지원하지 않습니다.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('File parse error:', error)
    return NextResponse.json(
      { error: '파일을 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
