# Supabase 마이그레이션

파일명 앞의 `YYYYMMDD_NN` 이 적용 순서입니다. 새 환경을 만들 때는 **이름순 그대로**
Supabase SQL Editor에 붙여넣어 실행하면 됩니다.

⚠️ 두 파일에는 되돌릴 수 없는 `DROP COLUMN` 단계가 들어 있습니다. 아래 표의
"주의" 항목을 먼저 읽어보세요.

## 적용 현황

전부 원격 프로젝트에 적용된 상태입니다 (아래 미실행 1건 제외).

| 파일 | 내용 | 상태 |
|---|---|---|
| `20260102_01_initial_schema.sql` | `profile`, `projects` 테이블 + 더미 프로필 1행 | ✅ |
| `20260102_02_projects_columns_and_storage.sql` | `projects.github_link` / `.content` 추가, `images` 스토리지 버킷 + 정책 | ✅ |
| `20260104_01_analytics.sql` | `daily_stats` 방문자 카운터 테이블 | ✅ |
| `20260104_02_secure_policies.sql` | 초기 RLS 정책 — **아래 참고, 상당 부분 폐기됨** | ⚠️ 일부 폐기 |
| `20260710_01_blog.sql` | 블로그 `posts` 테이블 | ✅ |
| `20260808_01_categories.sql` | `categories` 테이블, `posts.tags` → `category_id` 이관 | ✅ |
| `20260809_01_analytics_rpc.sql` | 빠져 있던 `increment_view()` 함수 (없어서 조회수가 0/1에 고정돼 있었음) | ✅ |
| `20260809_02_multi_category.sql` | `post_categories` 조인 테이블 — 글 하나에 카테고리 여러 개 | ⚠️ **4단계 미실행** |
| `20260809_03_db_optimization.sql` | 인덱스 정리, RLS 재작성, `posts.date` → `date` 타입 | ✅ |
| `20260809_04_i18n_content.sql` | `posts`/`projects`에 `*_en` 컬럼, `categories.name_en` — 콘텐츠 영어 번역용 | ✅ |
| `20260816_01_resume_platform.sql` | 이력서 아카이브 11개 테이블 + `profile`/`projects` 확장 | ✅ 소급 기록 (아래 참고) |
| `20260816_02_resume_versions.sql` | `resume_versions` (스냅샷 이력) 생성, `resume_presets` 폐기 | ✅ 2026-08-16 적용 |

## 주의사항

### `20260816_01_resume_platform.sql` 은 소급 기록입니다

이 파일이 만드는 테이블(`educations`, `experiences`, `certifications`, `awards`,
`cover_letters`, `personal_details`, `portfolio_items`, `education_courses`,
`language_activities` 등)은 이력서 기능 작업 **이전에** 이미 SQL Editor에서 직접 실행되어
원격에 존재했지만, 마이그레이션 폴더에는 기록되지 않은 상태였습니다.
2026-08-16에 파일로 옮겨 담았습니다. 멱등이므로 새 환경에서는 순서대로 실행하면 됩니다.

`20260809_03_db_optimization.sql` 이 이 테이블들의 RLS 정책을 먼저 작성해 둔 것도
같은 이유입니다 — 코드에는 없지만 DB에는 있었기 때문입니다.

### `20260816_02_resume_versions.sql` — `resume_presets` 를 삭제합니다

이력서 "버전 관리"를 프리셋(선택 조합만 저장) 대신 스냅샷(저장 시점 내용 전체 동결)으로
구현하면서 `resume_presets` 는 상위 호환인 `resume_versions` 로 대체됐습니다.
적용 시점에 `resume_presets` 는 0행이었고 앱 코드 어디서도 참조하지 않았습니다.

`resume_versions.snapshot` 에는 전화번호·생년월일·주소·병역 같은 민감 정보가 그대로
들어갈 수 있으므로, RLS는 `personal_details` / `cover_letters` 와 같은 **소유자 전용**입니다.


### `20260809_04_i18n_content.sql` — 2026-08-10 적용됨

전부 nullable `ADD COLUMN IF NOT EXISTS` 라 백필도, RLS 변경도, 되돌릴 수 없는 단계도
없었습니다. 기존 컬럼이 한국어 원본이고 `_en` 이 선택적 영어 번역입니다. 번역이 비어 있으면
앱이 원본으로 폴백하므로(`i18n/localize.ts` 의 `pick()`), 적용 후에도 기존 글 6개 /
프로젝트 5개는 그대로 한국어로 보입니다. 번역은 어드민의 "EN (optional)" 칸에 채워 넣습니다.

⚠️ **코드보다 먼저 실행해야 합니다.** `getPostSummaries()` 가 `title_en` 을 select하므로,
컬럼 없이 새 코드를 배포하면 쿼리가 실패해 블로그 글 페이지가 하나도 프리렌더되지 않습니다.

### `20260809_02_multi_category.sql` — 4단계가 아직 안 돌았습니다

1~3단계(조인 테이블 생성 + 백필 + RLS)는 2026-08-09에 적용됐고, 글 6개 전부
기존 카테고리가 그대로 옮겨진 것을 확인했습니다.

4단계 `ALTER TABLE posts DROP COLUMN category_id` 는 **일부러 남겨뒀습니다.**
앱은 이미 이 컬럼을 읽지 않으므로 언제 실행해도 되지만, 되돌릴 수 없으므로
새 다중 카테고리 동작을 실제로 써본 뒤에 실행하세요.

### `20260104_02_secure_policies.sql` 은 더 이상 현재 상태가 아닙니다

여기서 만든 `Admin Write *` 정책들은 `FOR ALL` 이라 SELECT까지 커버했고, 그 결과
공개 읽기 정책과 겹쳐서 인증된 읽기마다 정책이 두 번 평가됐습니다.
`20260809_03_db_optimization.sql` 이 이를 INSERT/UPDATE/DELETE 로 쪼개고
읽기 경로를 SELECT 정책 하나로 합쳤습니다.

**접근 권한 자체는 그대로입니다** — 관리자는 여전히 비공개 글과 비공개 프로젝트를
읽고, 소유자는 자기 비공개 행을 읽습니다. 바뀐 건 그게 어떻게 표현되는지뿐입니다.

과거 이력으로서 파일은 남겨두되, **현재 RLS 상태를 알고 싶다면
`20260809_03_db_optimization.sql` 을 보세요.**

### `20260809_03_db_optimization.sql` 은 코드 변경과 세트입니다

`posts.date` 를 `text` → `date` 로 바꾸므로, API가 `'YYYY-MM-DD'` 를 반환하게 됩니다.
짝이 되는 코드 변경(`formatPostDate()`, 어드민의 `<input type="date">`)이 없으면
날짜 표시가 깨집니다. 같이 배포하세요.

## 일부러 하지 않은 것

- **`*_order_idx` 인덱스** — Supabase 린터가 "미사용"으로 표시하지만 유지합니다.
  해당 테이블이 아직 비어 있어서 미사용으로 보일 뿐, 이력서 기능에 데이터가 쌓이면
  쓰이게 될 정렬용 인덱스입니다.
- **Leaked password protection** — SQL이 아니라 Auth 대시보드 설정입니다.
  Authentication → Policies 에서 켜세요. 아직 꺼져 있습니다.
- **`increment_view` 의 `SECURITY DEFINER` 경고** — 의도된 설계입니다.
  익명 방문자를 세는 게 목적이라 `anon` 이 호출할 수 있어야 합니다.
