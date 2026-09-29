-- 이력서 빌더 폐기. 앱 변경 배포와 /admin/resume 리다이렉트 확인 후 실행한다.
-- 기존 자료의 tags / is_public / display_order 값과 정책은 보존한다.
-- 저장 버전/스냅샷 및 기본 포함 설정은 삭제된다. 아카이브 원본 정보와 RLS는 유지한다.
-- 재실행 가능. 예상하지 못한 의존성이 있으면 CASCADE 없이 실패하고 전체 롤백한다.
BEGIN;

DROP TABLE IF EXISTS public.resume_versions;
DROP TABLE IF EXISTS public.resume_presets;

ALTER TABLE IF EXISTS public.projects DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.personal_details DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.educations DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.experiences DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.language_activities DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.certifications DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.education_courses DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.awards DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.project_contributions DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.portfolio_items DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE IF EXISTS public.cover_letters DROP COLUMN IF EXISTS include_in_resume_default;

COMMIT;
