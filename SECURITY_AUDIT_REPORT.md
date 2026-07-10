# 보안 감사 레포트 (Security Audit Report)

- **대상**: my-portfolio (morifolio.vercel.app) — Next.js 16 App Router + Supabase
- **감사일**: 2026-07-10
- **범위**: 저장소 전체 코드 + 라이브 Supabase DB(RLS 정책·함수·advisor) + 의존성(npm audit)
- **결과 요약**: 발견 8건 (High 2 · Medium 3 · Low 3) — **전건 수정 완료**. 별도 잔여 조치 4건은 아래 참조.

---

## 1. 발견 사항 및 수정 내역

### H-1. `daily_stats` 테이블 익명 쓰기 허용 (High)
- **위치**: 라이브 DB `public.daily_stats` RLS 정책 (`Public Insert Stats`, `Public Update Stats`)
- **공격 시나리오**: 클라이언트 번들에 포함된 공개 anon 키로 누구나 Supabase REST API를 직접 호출해 방문자 통계를 임의 값으로 조작(INSERT/UPDATE)하거나 오염시킬 수 있음.
- **수정**: 마이그레이션 `security_hardening_daily_stats_and_storage` 적용.
  - 익명 INSERT/UPDATE 정책 제거 → 테이블은 공개 읽기 전용
  - 조회수 집계는 `increment_view(date)` RPC(`SECURITY DEFINER`)로만 가능 — 호출당 +1만 허용되므로 임의 값 조작 불가
- **잔여 리스크**: RPC 반복 호출로 조회수 부풀리기는 여전히 가능(공개 카운터의 본질적 한계). 필요 시 Vercel/미들웨어 레벨 rate limiting 고려.

### H-2. 프로덕션 의존성 취약점 — next 16.1.1 외 (High)
- **위치**: `package.json` — `next@16.1.1`(high 등급 다수: 미들웨어 우회, 캐시 포이즈닝, CSP nonce XSS, DoS 등 20여 건), `ws@8.x`(메모리 노출), devDeps에 `handlebars`(critical) 등 총 11건
- **수정**:
  - `next` / `eslint-config-next` → **16.2.10** 업그레이드
  - `npm audit fix`로 ws 포함 나머지 일괄 패치
  - 결과: **critical/high 0건**. 테스트 6건 통과, 프로덕션 빌드 정상.
- **잔여**: next 내부 번들 `postcss` moderate 2건 — 빌드 타임 전용이라 런타임 노출 없음. next 패치 릴리스 대기 (audit의 "next@9.3.3 다운그레이드" 제안은 오탐이므로 적용 금지).

### M-1. HTTP 보안 헤더 전무 (Medium)
- **위치**: `next.config.ts` — CSP, X-Frame-Options 등 부재
- **공격 시나리오**: XSS 발생 시 피해 확산 제한 장치 없음, 클릭재킹(iframe 삽입), MIME 스니핑 가능.
- **수정**: `next.config.ts`에 `headers()` 추가 — 전 경로에 6종 적용:
  - `Content-Security-Policy` (self + Supabase + cdnjs/jsdelivr만 허용, `frame-ancestors 'none'`, `object-src 'none'`; 개발 모드에서만 `unsafe-eval` 허용)
  - `X-Frame-Options: DENY` / `X-Content-Type-Options: nosniff` / `Referrer-Policy: strict-origin-when-cross-origin` / `Permissions-Policy` / `Strict-Transport-Security`(2년)
- **검증**: 프로덕션 서버 기동 후 `curl -I`로 6종 모두 응답 확인, 홈페이지 정상 렌더(CSP 차단 없음).

### M-2. `/api/cron` 무인증 공개 엔드포인트 (Medium)
- **위치**: `app/api/cron/route.ts`
- **공격 시나리오**: 누구나 호출 가능한 keep-alive 엔드포인트 — 반복 호출로 DB 요청 유발(자원 낭비·저강도 DoS 벡터).
- **수정**: `Authorization: Bearer ${CRON_SECRET}` 검증 추가(Vercel Cron 표준 패턴). 시크릿 미설정 시에도 무조건 401(fail-closed). `.env.example`에 `CRON_SECRET` 항목 추가.
- **검증**: 시크릿 없음/불일치 → 401, 일치 → 200 확인.

### M-3. CDN 스타일시트 무결성 검증 없음 + 가변 버전 (Medium)
- **위치**: `app/layout.tsx` — Font Awesome(cdnjs), devicon(`@latest`, jsdelivr) SRI 미적용
- **공격 시나리오**: CDN 침해 또는 devicon 저장소의 악성 릴리스 시 변조된 CSS가 그대로 로드됨(공급망 공격).
- **수정**: devicon `@latest` → **2.17.0 고정**, 두 링크 모두 SRI `integrity`(sha384, 실제 CDN 파일에서 계산) + `crossorigin='anonymous'` 적용.

### L-1. `increment_view` 함수 `search_path` 미고정 (Low)
- **위치**: 라이브 DB `public.increment_view` — Supabase advisor 경고(`function_search_path_mutable`)
- **수정**: `SET search_path = public, pg_temp`로 재생성. 스키마 하이재킹 방지. (H-1 마이그레이션에 포함)

### L-2. 공개 스토리지 버킷 파일 목록 조회 허용 (Low)
- **위치**: `storage.objects`의 `Public Access` SELECT 정책 — advisor 경고(`public_bucket_allows_listing`)
- **수정**: 정책 제거. 공개 URL을 통한 개별 파일 접근은 영향 없음(앱 코드는 storage API 미사용 확인).

### L-3. `fetchGithubRepo` 입력 검증 미흡 (Low)
- **위치**: `utils/github.ts`, `app/actions.ts:149`
- **공격 시나리오**: `owner`/`repo`가 검증 없이 GitHub API URL 경로에 삽입 — `../` 등으로 의도치 않은 API 경로 호출 가능(호스트는 api.github.com으로 고정되어 있어 영향 제한적).
- **수정**: GitHub 네이밍 규칙 정규식 검증(`owner`: 영숫자·하이픈, `repo`: 영숫자·`._-`, `.`/`..` 거부) + URL 삽입 시 `encodeURIComponent` 적용.

---

## 2. 점검 결과 안전 확인된 항목 (수정 불필요)

| 영역 | 확인 내용 |
|---|---|
| 시크릿 관리 | git 전체 이력에 `.env`/키 파일 커밋 없음. `.gitignore`가 `.env*` 커버. 코드에 service_role 키 등 비밀값 없음 (anon 키는 공개 전제 설계) |
| 인증/인가 | 3중 방어 — `middleware.ts`(경로 차단) + `app/admin/layout.tsx`(서버 검증) + 모든 변경 Server Action의 개별 `isAuthenticated()` 재검증 |
| `profile`/`projects` RLS | `secure_policies.sql` 이미 적용됨 — 공개 읽기 / authenticated만 쓰기 |
| XSS | README 마크다운은 `rehype-sanitize` 적용, `dangerouslySetInnerHTML` 2곳 모두 정적 데이터만 사용, `eval`/`document.write` 없음 |
| 링크 | 모든 `target="_blank"`에 `rel="noopener noreferrer"` |
| CI | GitHub Actions는 Secrets로 환경변수 주입 (하드코딩 없음) |

---

## 3. 잔여 조치 사항 (직접 수행 필요)

1. **[필수·배포 전] Vercel에 `CRON_SECRET` 등록** — Vercel 프로젝트 → Settings → Environment Variables에 `CRON_SECRET` 추가(예: `openssl rand -hex 32`로 생성). **미등록 시 cron이 fail-closed(401)로 동작해 DB keep-alive가 멈추므로 이번 배포 전 반드시 등록.** Vercel은 이 변수가 있으면 cron 호출에 자동으로 `Authorization: Bearer` 헤더를 붙임.
2. **[권장] Supabase 유출 비밀번호 보호 활성화** — Dashboard → Authentication → Passwords에서 "Leaked password protection" 켜기 ([가이드](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).
3. **[권장] Supabase 신규 가입 비활성화 확인** — Dashboard → Authentication → Sign In / Up에서 "Allow new users to sign up" **꺼져 있는지 확인**. RLS가 `authenticated` = 관리자라는 전제이므로, 가입이 열려 있으면 누구나 가입 후 프로젝트/프로필을 수정할 수 있음.
4. **[참고] 남은 advisor 경고는 의도된 설계** — `profile`/`projects`의 authenticated 전체 쓰기(단일 관리자 구조), `increment_view`의 anon 실행 허용(공개 조회수 집계 기능). 3번 확인이 전제 조건.

---

## 4. 변경 파일 요약

| 파일 | 변경 |
|---|---|
| `next.config.ts` | 보안 헤더 6종 (`headers()`) |
| `app/api/cron/route.ts` | `CRON_SECRET` Bearer 인증 (fail-closed) |
| `app/layout.tsx` | devicon 2.17.0 고정 + CDN 링크 2건 SRI |
| `utils/github.ts` | owner/repo 정규식 검증 |
| `app/actions.ts` | GitHub URL 경로 `encodeURIComponent` |
| `.env.example` | `CRON_SECRET` 항목 |
| `package.json` / `package-lock.json` | next 16.2.10, 취약 의존성 패치 |
| 라이브 DB (마이그레이션) | `daily_stats` 쓰기 정책 제거, `increment_view` SECURITY DEFINER + search_path 고정, 버킷 목록 정책 제거 |

## 5. 검증 결과

- `npm test` — 2 suites / 6 tests 통과
- `npm run build` — 프로덕션 빌드 성공 (참고: next 16.2부터 `middleware.ts` → `proxy.ts` 이름 변경 권고 deprecation 경고 있음, 동작에는 영향 없음)
- 프로덕션 서버 실기동 검증 — 보안 헤더 6종 응답, 홈 200 + devicon 2.17.0 로드, cron 401/401/200 (무인증/오류/정상)
- 라이브 DB `pg_policies` 재조회 — `daily_stats` 쓰기 정책 소멸 확인, RPC `SECURITY DEFINER`·`search_path=public, pg_temp`·anon 실행 권한 확인
- Supabase security advisor 재실행 — 수정 대상 경고 4건 해소 확인
