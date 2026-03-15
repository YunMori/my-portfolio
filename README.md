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
- **동적 프로젝트 관리** — Admin 대시보드에서 프로젝트 추가/수정, GitHub README 자동 로드
- **Live Tech Stats** — 등록된 프로젝트의 기술 스택을 집계해 실시간으로 표시
- **방문자 통계** — 일별 페이지뷰 추적 + 차트 시각화 (관리자 전용)
- **다국어 지원** — 한국어/영어 전환 (Context API + localStorage 유지)
- **스크롤 애니메이션** — Staggered hero 진입, CSS scroll-driven animations, 카드 리빌 효과
- **Scroll Progress Bar** — CSS `animation-timeline: scroll()` 기반 상단 프로그레스 바

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
├── page.tsx              # 홈 (서버 컴포넌트, Supabase fetch)
├── admin/                # 관리자 페이지
├── globals.css           # 테마, 애니메이션, 그레인 효과
└── layout.tsx            # 폰트, 메타데이터

components/
├── Hero.tsx              # 히어로 섹션
├── TechStack.tsx         # 기술 스택 통계
├── Projects.tsx          # 프로젝트 그리드 + 모달
├── SocialProof.tsx       # 프로젝트/기술 수 통계 스트립
├── ScrollProgress.tsx    # 스크롤 프로그레스 바
├── Navbar.tsx            # 네비게이션
└── Footer.tsx            # 푸터 + 마키

utils/
├── translations.ts       # i18n 문자열 (ko/en)
└── supabase/             # Supabase 클라이언트
```

## 라이선스

MIT
