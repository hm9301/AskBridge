'use client'

import { useRef, useState } from 'react'

interface InputSectionProps {
  content: string
  onChange: (value: string) => void
  isLoading: boolean
}

// 클라이언트에서 바로 읽을 수 있는 포맷
const CLIENT_SIDE_EXTS = new Set(['.txt', '.md', '.csv'])

// 서버로 보내야 하는 포맷
const SERVER_SIDE_EXTS = new Set(['.pdf', '.pptx', '.docx'])

const ACCEPTED_EXTS = [...CLIENT_SIDE_EXTS, ...SERVER_SIDE_EXTS, '.ipynb']

interface FormatBadge {
  label: string
  color: string
}

const FORMAT_BADGES: FormatBadge[] = [
  { label: 'PDF', color: 'bg-red-50 text-red-500' },
  { label: 'PPTX', color: 'bg-orange-50 text-orange-500' },
  { label: 'DOCX', color: 'bg-blue-50 text-blue-500' },
  { label: 'TXT', color: 'bg-gray-100 text-gray-500' },
  { label: 'MD', color: 'bg-purple-50 text-purple-500' },
  { label: 'CSV', color: 'bg-green-50 text-green-500' },
  { label: 'IPYNB', color: 'bg-yellow-50 text-yellow-600' },
]

function getExt(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

function extractIpynbText(json: Record<string, unknown>): string {
  const cells = json.cells as Array<{ cell_type: string; source: string[] | string }> | undefined
  if (!cells) throw new Error('.ipynb 파일 구조를 인식할 수 없습니다.')

  const lines: string[] = []
  for (const cell of cells) {
    const src = Array.isArray(cell.source) ? cell.source.join('') : cell.source
    if (!src.trim()) continue
    if (cell.cell_type === 'markdown') {
      lines.push(src)
    } else if (cell.cell_type === 'code') {
      lines.push('```python\n' + src + '\n```')
    }
  }
  return lines.join('\n\n')
}

export default function InputSection({ content, onChange, isLoading }: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const processFile = async (file: File) => {
    setFileError(null)
    setIsFileLoading(true)
    setUploadedFileName(null)

    try {
      const ext = getExt(file.name)

      if (!ACCEPTED_EXTS.includes(ext)) {
        throw new Error(
          `지원하지 않는 형식입니다. (PDF, PPTX, DOCX, TXT, MD, CSV, IPYNB 지원)`
        )
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('파일 크기는 10MB 이하여야 합니다.')
      }

      let text = ''

      // 클라이언트 사이드 처리
      if (CLIENT_SIDE_EXTS.has(ext)) {
        text = await file.text()
      } else if (ext === '.ipynb') {
        const raw = await file.text()
        const json = JSON.parse(raw)
        text = extractIpynbText(json)
      } else {
        // 서버 사이드 처리 (PDF, PPTX, DOCX)
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-file', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || '파일 처리 실패')
        text = data.text
      }

      if (!text.trim()) {
        throw new Error('파일에서 텍스트를 추출할 수 없습니다.')
      }

      onChange(text)
      setUploadedFileName(file.name)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.')
    } finally {
      setIsFileLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-blue-300 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTS.join(',')}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isLoading || isFileLoading}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center gap-3 ${
            isLoading || isFileLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
            {isFileLoading ? (
              <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isFileLoading ? '파일 처리 중...' : '파일 업로드'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">클릭하거나 드래그 (최대 10MB)</p>
          </div>

          {/* 지원 포맷 뱃지 */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {FORMAT_BADGES.map(({ label, color }) => (
              <span key={label} className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </label>

        {uploadedFileName && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="truncate max-w-xs">{uploadedFileName} 업로드 완료</span>
          </div>
        )}

        {fileError && (
          <p className="mt-2 text-sm text-red-500">{fileError}</p>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">또는 직접 입력</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || isFileLoading}
          placeholder="수업 자료 내용을 여기에 붙여넣기 하세요..."
          className="w-full p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ height: '160px' }}
        />
        <div className={`absolute bottom-3 right-3 text-xs ${content.length > 20000 ? 'text-red-400 font-medium' : content.length > 16000 ? 'text-yellow-400' : 'text-gray-300'}`}>
          {content.length.toLocaleString()} / 20,000자
        </div>
      </div>
    </div>
  )
}
