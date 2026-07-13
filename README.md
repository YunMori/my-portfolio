# Morifolio

## 기술 스택

| 분류 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Font Awesome, Devicon |
| Fonts | Syne (display), Gowun Dodum (body) |
| Backend | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel |
| Testing | Jest, Testing Library |

## 주요 기능

- **에디토리얼 디자인** — Forest Green(`#4a7c59`) + Warm Brown 컬러 팔레트, Syne 디스플레이 폰트, 필름 그레인 오버레이
- **Hero 애니메이션** — Staggered 진입 애니메이션, 지형도(topographic) 배경 패턴
- **동적 프로젝트 관리** — Admin 대시보드에서 프로젝트 추가/수정, GitHub README 자동 로드
- **Live Tech Stats** — 등록된 프로젝트의 기술 스택을 집계해 실시간으로 표시
- **방문자 통계** — 일별 페이지뷰 추적 + 차트 시각화 (관리자 전용)
- **다국어 지원** — 한국어/영어 전환 (Context API + localStorage 유지)
- **Scroll Progress Bar** — CSS `animation-timeline: scroll()` 기반 상단 프로그레스 바
- **SEO** — `sitemap.ts`, `robots.ts` 자동 생성

## Lighthouse

> 측정일: 2026-03-26 · 환경: Vercel Production (morifolio.vercel.app)

| 항목 | 점수 |
|---|---|
| Performance | 99 |
| Accessibility | 94 |
| Best Practices | 100 |
| SEO | 100 |

| 지표 | 값 |
|---|---|
| FCP | 317ms |
| LCP | 497ms |
| TBT | 0ms |
| CLS | 0 |

## 시작하기

### 요구사항

- Node.js 20+
- Supabase 프로젝트

### 설치

```bash
git clone https://github.com/YunMori/my-portfolio.git
cd my-portfolio
npm install
```

### 환경 변수

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### DB 설정

Supabase SQL Editor에서 순서대로 실행:

1. `schema.sql` — 기본 테이블 생성
2. `migration.sql` — 추가 컬럼
3. `secure_policies.sql` — RLS 보안 정책
4. `blog_migration.sql` — 블로그(posts) 테이블
5. `resume_platform_migration.sql` — 이력서 아카이브/빌더 테이블 (⚠️ 이력서 기능 사용 전 필수 실행)

### 개발 서버

```bash
npm run dev
# http://localhost:3000
```

## Admin

`/login` 에서 Supabase 계정으로 로그인 후 접근 가능합니다.

| 경로 | 설명 |
|---|---|
| `/admin` | 방문자 통계 대시보드 |
| `/admin/projects` | 프로젝트 CRUD |
| `/admin/posts` | 블로그 글 CRUD |
| `/admin/archive` | 이력서 아카이브 (학력/경력/자격증 등 카테고리별 CRUD + 드래그 정렬) |
| `/admin/archive/basic` | 기본 정보 · 인적 사항(비공개) 편집 |
| `/admin/resume` | 이력서 빌더 — 토글 선택 → 실시간 PDF 미리보기 → PDF 내보내기, 프리셋 저장 |

### 이력서 빌더

- 항목별 토글 초기값은 각 레코드의 `include_in_resume_default`
- 인적 사항(생년월일/주소/병역/전화번호)과 자기소개서는 RLS로 익명 조회가 차단되며, 빌더에서도 기본 제외
- 토글 조합은 프리셋(예: "백엔드 지원용")으로 저장/재사용 가능
- PDF는 NanumGothic 임베딩으로 한글이 보장되는 A4 벡터 문서로 생성됩니다

## 프로젝트 구조

```
app/
├── page.tsx              # 홈 (서버 컴포넌트, Supabase fetch)
├── admin/                # 관리자 페이지
├── api/                  # API 라우트
├── login/                # 로그인 페이지
├── globals.css           # 테마, 애니메이션, 그레인 효과
├── sitemap.ts            # 사이트맵 자동 생성
└── layout.tsx            # 폰트, 메타데이터

components/
├── Hero.tsx              # 히어로 섹션 (지형도 배경 + 스태거 애니메이션)
├── TechStack.tsx         # 기술 스택 통계
├── Projects.tsx          # 프로젝트 그리드 + 모달
├── SocialProof.tsx       # 프로젝트/기술 수 통계 스트립
├── ScrollProgress.tsx    # 스크롤 프로그레스 바
├── HomeClient.tsx        # 홈 클라이언트 래퍼
├── Providers.tsx         # Context 프로바이더
├── Navbar.tsx            # 네비게이션
└── Footer.tsx            # 푸터 + 마키

utils/
├── translations.ts       # i18n 문자열 (ko/en)
├── github.ts             # GitHub README 페칭
├── url.ts                # 베이스 URL 유틸
└── supabase/             # Supabase 클라이언트
```

## 테스트

```bash
npm test
npm run test:watch
```

## 라이선스

MIT
