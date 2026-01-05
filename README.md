# 포트폴리오: 데이터 기반의 확장 가능한 아키텍처

**Next.js 15**와 **Supabase**로 구축된 최신 고성능 포트폴리오 웹사이트입니다. 이 프로젝트는 깔끔하고 데이터 중심적인 디자인과 함께 방문자 통계, 다국어 지원 등 강력한 백엔드 관리 기능을 제공합니다.

![미리보기](/og-image.jpg)

## 🔥 주요 기능

- **반응형 & 감각적인 디자인**: **Tailwind CSS v4**로 제작되었으며, 부드러운 애니메이션(`tailwindcss-animate`), 다크 모드 지원, 고품질 타이포그래피(`Gowun Dodum` & `Space Grotesk`)를 제공합니다.
- **동적 콘텐츠 관리**: 관리자 대시보드를 통해 다음 항목을 쉽게 업데이트할 수 있습니다:
  - **프로젝트**: GitHub에서 데이터(readme, stars, 언어)를 자동으로 가져오거나 수동으로 입력할 수 있습니다.
- **방문자 통계**: 자체 제작된 개인정보 친화적 방문자 추적 시스템입니다. 관리자 대시보드에서 일일 방문자 추이를 바로 확인할 수 있습니다.
- **다국어 지원 (i18n)**: 영어/한국어 전환이 매끄럽게 이루어지며, 사용자의 언어 설정이 유지됩니다.
- **프로젝트 시뮬레이터**: 인터랙티브한 "프로젝트 시뮬레이터" 플로팅 액션 버튼 (컨셉 기능).
- **GitHub 통합**: 연결된 저장소의 README 내용을 자동으로 가져와 풍부한 프로젝트 상세 정보를 보여줍니다.

## 🛠 기술 스택

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Font Awesome
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (추천)

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- Supabase 프로젝트

### 설치 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/YunMori/my-portfolio.git
   cd my-portfolio
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   최상위 디렉토리에 `.env.local` 파일을 생성합니다:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **데이터베이스 마이그레이션 & 보안 설정**
   Supabase SQL Editor에서 아래 스크립트들을 순서대로 실행하여 테이블을 생성하고 보안 정책(RLS)을 적용합니다.
   - `schema.sql` 실행 (기본 스키마)
   - `migration.sql` 실행 (추가 컬럼)
   - **중요**: `secure_policies.sql` 실행 (통계 테이블 생성 & 강력한 보안 규칙 적용)

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 🛡 관리자 접속

관리자 대시보드에 접속하려면 `/login`으로 이동하여 Supabase 계정으로 로그인하세요.
- **대시보드**: `/admin`
- **프로젝트 관리**: `/admin/projects`

## 🌍 다국어 지원 (Internationalization)

이 프로젝트는 Context API 기반의 경량화된 i18n 솔루션을 사용합니다.
- 번역 데이터는 `utils/translations.ts`에 저장됩니다.
- 언어 상태는 `context/LanguageContext.tsx`에서 관리됩니다.

## 📊 방문자 통계

방문자 데이터는 `daily_stats` 테이블에 저장됩니다. `incrementView` 서버 액션이 페이지 로드를 추적하며, `VisitorChart` 컴포넌트가 `chart.js`를 사용하여 데이터를 시각화합니다.

## 📝 라이선스

이 프로젝트는 오픈 소스이며 [MIT License](LICENSE)를 따릅니다.
