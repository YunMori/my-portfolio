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

`supabase/migrations/` 의 파일을 **이름순 그대로** Supabase SQL Editor에서 실행하면 됩니다.
파일명 앞의 `YYYYMMDD_NN` 이 곧 적용 순서입니다.

각 파일이 무엇을 하는지, 어떤 단계가 파괴적이라 확인 후 실행해야 하는지는
[`supabase/migrations/README.md`](supabase/migrations/README.md) 에 정리돼 있습니다.

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

## 프로젝트 구조

```
app/
├── page.tsx              # 홈 (서버 컴포넌트, 정적 생성)
├── actions/              # 서버 액션 — 도메인별로 분리
│   ├── analytics.ts      #   방문자 카운트
│   ├── auth.ts           #   로그아웃
│   ├── categories.ts     #   카테고리 조회/CRUD
│   ├── posts.ts          #   글 조회/CRUD
│   └── projects.ts       #   프로젝트 조회/CRUD + GitHub 연동
├── admin/                # 관리자 페이지
├── api/cron/             # Supabase sleep 방지 핑
├── blog/                 # 블로그 목록 + 글 상세
├── login/                # 로그인 페이지
├── globals.css           # 테마, 애니메이션, 그레인 효과
├── sitemap.ts            # 사이트맵 자동 생성
└── layout.tsx            # 폰트, 메타데이터

components/               # 쓰이는 화면 기준으로 묶음
├── home/                 # Hero, TechStack, Projects, SocialProof
├── blog/                 # BlogList, PostBody
├── admin/                # 관리자 폼/차트
├── layout/               # Navbar, Footer, Providers
└── behavior/             # 렌더 결과가 없는 동작 전용 컴포넌트
                          #   ScrollProgress, ScrollReveal, PageViewTracker

i18n/                     # 언어 전환 기능 한 곳에
├── LanguageContext.tsx
└── translations.ts       # ko/en 문자열

utils/
├── auth.ts               # 요청 단위로 캐시되는 현재 사용자
├── post.ts               # 슬러그, 목차, 읽기시간, 날짜 포맷
├── projects.ts           # 기술 스택 집계
├── github.ts             # GitHub README 페칭
├── url.ts                # 베이스 URL 유틸
└── supabase/             # 클라이언트 4종
    ├── client.ts         #   브라우저용
    ├── server.ts         #   쿠키 기반 (관리자·인증)
    ├── public.ts         #   쿠키 없음 (공개 읽기 — 정적 렌더 유지)
    └── session.ts        #   미들웨어 세션 갱신

supabase/migrations/      # 적용 순서대로 번호가 붙은 SQL
docs/                     # 감사 리포트 등 문서
```

## 테스트

```bash
npm test
npm run test:watch
```

## 라이선스

MIT
