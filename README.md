# AskBridge

> 수업 자료를 업로드하면 AI가 학습 목표, 예상 질문, 단답형 퀴즈를 자동 생성하고 학생에게 바로 공유할 수 있는 교육용 AI 솔루션

## 서비스 소개

교강사가 수업 자료를 준비한 후 "학생들이 어떤 부분을 어려워할까?"를 고민하는 시간은 생각보다 많습니다.  
AskBridge는 수업 자료를 분석해 **학습 목표 → 예상 질문 → 단답형 퀴즈**를 한 번에 생성하고,  
교사가 원하는 항목만 선택해 학생에게 공유 링크로 즉시 전달하는 **교육 현장 맞춤형 AI 워크플로우**를 제공합니다.

```
교사: 수업 자료 업로드 → AI 분석 → 질문/퀴즈 선택 → 공유 링크 전송
학생: 링크 접속 → 예상 질문 확인 → 퀴즈 직접 풀기
```

## 주요 기능

### 교사 화면
- **다양한 파일 포맷 지원**: PDF, PPTX, DOCX, TXT, MD, CSV, IPYNB (Jupyter Notebook)
- **대상 수준 설정**: 입문 / 기초 / 중급 / 심화별 맞춤 질문 생성
- **실시간 스트리밍**: 분석 결과를 기다리지 않고 생성되는 즉시 화면에 표시
- **질문/퀴즈 선택**: 체크박스로 원하는 항목만 선택 후 공유 — AI 생성 결과를 교사가 큐레이션 가능
- **난이도 필터**: 상/중/하 난이도별 필터링
- **공유 링크**: 선택한 섹션(학습 목표/예상 질문/퀴즈)을 URL로 압축 — 별도 서버 불필요
- **인쇄**: 섹션 선택 + 정답 포함/제외 선택 후 인쇄, 섹션마다 새 페이지로 분리
- **내보내기**: Markdown / HTML 파일 저장, 클립보드 복사
- **분석 히스토리**: localStorage 기반 최근 10개 기록 저장/불러오기

### 학생 화면 (`/share`)
- 교사가 공유한 링크로 접속
- 학습 목표 확인
- 예상 질문 열람
- 단답형 퀴즈 직접 풀기 (힌트 보기 / 정답 확인)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Anthropic Claude Sonnet 4.6 (claude-sonnet-4-6) |
| 파일 파싱 | pdf-parse, mammoth (DOCX), unzipper (PPTX), 브라우저 내장 (TXT/MD/CSV) |
| URL 압축 | lz-string (LZString) |
| 상태 관리 | React useState / useEffect |

## AI 활용 방식

### 스트리밍 실시간 렌더링
Claude API의 스트리밍 응답을 커스텀 JSON 파서(`lib/streamParser.ts`)로 실시간 파싱합니다.  
응답이 완료되기 전에 파싱된 항목부터 순차적으로 화면에 표시되어 사용자 체감 속도를 크게 향상시킵니다.

### 프롬프트 캐싱
시스템 프롬프트에 `cache_control: ephemeral`을 적용해 동일 수준 반복 호출 시 캐시 히트로 응답 속도와 비용을 절감합니다.

### 구조화된 JSON 출력
단일 API 호출로 학습 목표 / 예상 질문 / 퀴즈를 한 번에 생성합니다.  
각 질문에는 **출제 이유**, **모범 답변**, **난이도**, **출처 섹션**이 포함되어 교사가 결과를 신뢰하고 활용할 수 있습니다.

### 대상 수준별 맞춤 프롬프트
입문 / 기초 / 중급 / 심화 수준에 따라 시스템 프롬프트 컨텍스트를 동적으로 주입합니다.

## 로컬 실행

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 설정
# .env.local 파일 생성 후 아래 내용 입력
ANTHROPIC_API_KEY=your_api_key_here

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 프로젝트 구조

```
app/
  api/analyze/    # Claude API 스트리밍 엔드포인트
  share/          # 학생용 공유 페이지
components/
  InputSection    # 파일 업로드 + 텍스트 입력
  ObjectiveList   # 학습 목표 목록
  ResultList      # 예상 질문 목록 (난이도 필터, 선택)
  ResultCard      # 개별 질문 카드
  QuizList        # 퀴즈 목록 (난이도 필터, 선택)
  QuizCard        # 개별 퀴즈 카드 (힌트/정답)
  QuizListAnswerable  # 학생용 퀴즈 목록
lib/
  streamParser    # 스트리밍 버퍼에서 JSON 실시간 추출
  share           # LZString URL 인코딩/디코딩
  history         # localStorage 히스토리 관리
  export          # MD / HTML / 클립보드 내보내기
```

## 차별점

- **IPYNB 지원**: 데이터 사이언스, 프로그래밍 수업의 Jupyter Notebook을 바로 분석
- **서버리스 공유**: 별도 DB 없이 LZString URL 압축으로 공유 링크 생성
- **교사-학생 분리 UX**: 교사용 관리 화면과 학생용 풀이 화면을 명확히 분리
- **인쇄 최적화**: 정답 포함/제외 버전 선택, 섹션별 페이지 분리

---

© KongMu
