import type { Objective, Question, Quiz } from '@/app/api/analyze/route'

const DIFFICULTY_COLOR: Record<string, string> = {
  상: '#ef4444',
  중: '#f59e0b',
  하: '#22c55e',
}

// ─── Markdown ────────────────────────────────────────────────

function objectivesToMarkdown(objectives: Objective[]): string {
  return objectives
    .map((obj, i) => [
      `## ${i + 1}. ${obj.title}`,
      obj.description ? obj.description : null,
    ].filter(Boolean).join('\n'))
    .join('\n\n---\n\n')
}

function questionsToMarkdown(questions: Question[]): string {
  return questions
    .map((q, i) => {
      const lines: (string | null)[] = [
        `## Q${i + 1}. ${q.question}`,
        q.difficulty ? `**난이도**: ${q.difficulty}` : null,
        q.section ? `**출처 섹션**: ${q.section}` : null,
        '',
        `**왜 헷갈릴 수 있나요?**`,
        q.reason,
        '',
        `**모범 답변**`,
        q.answer,
        q.source ? `> "${q.source}"` : null,
      ]
      return lines.filter((l) => l !== null).join('\n')
    })
    .join('\n\n---\n\n')
}

function quizzesToMarkdown(quizzes: Quiz[]): string {
  return quizzes
    .map((q, i) => {
      const lines: (string | null)[] = [
        `## Quiz ${i + 1}`,
        q.difficulty ? `**난이도**: ${q.difficulty}` : null,
        '',
        `**문제**: ${q.sentence}`,
        '',
        `**힌트**: ${q.hint}`,
        '',
        `**정답**: ${q.answer}`,
      ]
      return lines.filter((l) => l !== null).join('\n')
    })
    .join('\n\n---\n\n')
}

// ─── HTML ─────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${color}22;color:${color}">${esc(text)}</span>`
}

function objectivesToHtml(objectives: Objective[]): string {
  return objectives.map((obj, i) => `
    <div class="card">
      <div class="card-header">
        <span class="num obj-num">${i + 1}</span>
        <div class="card-title">
          <p class="question">${esc(obj.title)}</p>
        </div>
      </div>
      ${obj.description ? `<div class="card-body"><p>${esc(obj.description)}</p></div>` : ''}
    </div>`).join('\n')
}

function questionsToHtml(questions: Question[]): string {
  return questions.map((q, i) => `
    <div class="card">
      <div class="card-header">
        <span class="num">${i + 1}</span>
        <div class="card-title">
          ${q.difficulty ? badge(`난이도 ${q.difficulty}`, DIFFICULTY_COLOR[q.difficulty] ?? '#6b7280') : ''}
          <p class="question">${esc(q.question)}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="section">
          <p class="label reason-label">왜 헷갈릴 수 있나요?</p>
          <p>${esc(q.reason)}</p>
        </div>
        <div class="section">
          <p class="label answer-label">모범 답변</p>
          <p class="answer-box">${esc(q.answer)}</p>
        </div>
        ${q.section || q.source ? `
        <div class="section">
          <p class="label source-label">출처</p>
          ${q.section ? `<div style="margin-bottom:6px">${badge(q.section, '#22c55e')}</div>` : ''}
          ${q.source ? `<blockquote>${esc(q.source)}</blockquote>` : ''}
        </div>` : ''}
      </div>
    </div>`).join('\n')
}

function quizzesToHtml(quizzes: Quiz[]): string {
  return quizzes.map((q, i) => `
    <div class="card">
      <div class="card-header">
        <span class="num quiz-num">${i + 1}</span>
        <div class="card-title">
          ${q.difficulty ? badge(`난이도 ${q.difficulty}`, DIFFICULTY_COLOR[q.difficulty] ?? '#6b7280') : ''}
          <p class="question">${esc(q.sentence).replace(/___/g, '<span class="blank">________</span>')}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="section">
          <p class="label hint-label">힌트</p>
          <p>${esc(q.hint)}</p>
        </div>
        <div class="section">
          <p class="label answer-label">정답</p>
          <p class="answer-box">${esc(q.answer)}</p>
        </div>
      </div>
    </div>`).join('\n')
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 20px; font-weight: 700; margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 16px; overflow: hidden; }
  .card-header { display: flex; gap: 16px; align-items: flex-start; padding: 20px; }
  .num { width: 28px; height: 28px; background: #dbeafe; color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .quiz-num { background: #ede9fe; color: #7c3aed; }
  .obj-num { background: #d1fae5; color: #059669; }
  .card-title { flex: 1; }
  .card-title > span { margin-right: 6px; margin-bottom: 6px; display: inline-block; }
  .question { font-weight: 600; font-size: 15px; margin-top: 6px; line-height: 1.6; }
  .card-body { padding: 0 20px 20px 64px; display: flex; flex-direction: column; gap: 12px; }
  .section { }
  .label { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
  .reason-label { color: #d97706; }
  .answer-label { color: #2563eb; }
  .hint-label { color: #d97706; }
  .source-label { color: #16a34a; }
  .answer-box { background: #eff6ff; border-radius: 8px; padding: 10px 14px; font-size: 14px; line-height: 1.6; }
  blockquote { font-style: italic; color: #64748b; font-size: 13px; border-left: 3px solid #bbf7d0; padding-left: 12px; margin-top: 4px; }
  .blank { display: inline-block; min-width: 80px; border-bottom: 2px solid #6366f1; color: #6366f1; text-align: center; font-weight: 700; }
  @media print { body { background: white; padding: 0; } }
</style>
</head>
<body>
<div class="container">
  <h1>AskBridge 분석 결과</h1>
  <p class="subtitle">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 생성</p>
  ${body}
</div>
</body>
</html>`
}

// ─── Public API ──────────────────────────────────────────────

export function copyObjectivesToClipboard(objectives: Objective[]): Promise<void> {
  return navigator.clipboard.writeText(objectivesToMarkdown(objectives))
}

export function downloadObjectivesAsMarkdown(objectives: Objective[]): void {
  downloadFile(`# AskBridge 학습 목표\n\n${objectivesToMarkdown(objectives)}`, 'text/markdown', '_objectives.md')
}

export function downloadObjectivesAsHtml(objectives: Objective[]): void {
  const body = `<h2>🎯 학습 목표</h2>${objectivesToHtml(objectives)}`
  downloadFile(wrapHtml('AskBridge 학습 목표', body), 'text/html', '_objectives.html')
}

export function copyToClipboard(questions: Question[]): Promise<void> {
  return navigator.clipboard.writeText(questionsToMarkdown(questions))
}

export function copyQuizzesToClipboard(quizzes: Quiz[]): Promise<void> {
  return navigator.clipboard.writeText(quizzesToMarkdown(quizzes))
}

export function downloadAsMarkdown(questions: Question[], quizzes: Quiz[]): void {
  const sections = ['# AskBridge 분석 결과', '', '## 📋 예상 질문', '', questionsToMarkdown(questions)]
  if (quizzes.length > 0) {
    sections.push('', '---', '', '## 📝 단답형 퀴즈', '', quizzesToMarkdown(quizzes))
  }
  downloadFile(sections.join('\n'), 'text/markdown', '.md')
}

export function downloadQuizzesAsMarkdown(quizzes: Quiz[]): void {
  downloadFile(`# AskBridge 단답형 퀴즈\n\n${quizzesToMarkdown(quizzes)}`, 'text/markdown', '_quiz.md')
}

// 예상 질문만 HTML 저장 (질문 탭에서 사용)
export function downloadQuestionsAsHtml(questions: Question[]): void {
  const body = `<h2>📋 예상 질문</h2>\n${questionsToHtml(questions)}`
  downloadFile(wrapHtml('AskBridge 예상 질문', body), 'text/html', '_questions.html')
}

// 질문 + 퀴즈 통합 HTML 저장 (필요 시 사용)
export function downloadAsHtml(questions: Question[], quizzes: Quiz[]): void {
  const body = [
    `<h2>📋 예상 질문</h2>`,
    questionsToHtml(questions),
    quizzes.length > 0 ? `<h2>📝 단답형 퀴즈</h2>${quizzesToHtml(quizzes)}` : '',
  ].join('\n')
  downloadFile(wrapHtml('AskBridge 분석 결과', body), 'text/html', '.html')
}

export function downloadQuizzesAsHtml(quizzes: Quiz[]): void {
  const body = `<h2>📝 단답형 퀴즈</h2>${quizzesToHtml(quizzes)}`
  downloadFile(wrapHtml('AskBridge 단답형 퀴즈', body), 'text/html', '_quiz.html')
}

function downloadFile(content: string, mimeType: string, suffix: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `askbridge_${new Date().toISOString().slice(0, 10)}${suffix}`
  a.click()
  URL.revokeObjectURL(url)
}
