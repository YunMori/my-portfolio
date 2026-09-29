-- 이력서 빌더 폐기. 앱 변경 배포 후 실행한다.
-- 저장 버전/스냅샷 및 기본 포함 설정은 삭제된다. 아카이브 원본 정보와 RLS는 유지한다.
-- 재실행 가능. 예상하지 못한 의존성이 있으면 CASCADE 없이 실패하고 전체 롤백한다.
BEGIN;

DROP TABLE IF EXISTS public.resume_versions;
DROP TABLE IF EXISTS public.resume_presets;

ALTER TABLE public.projects DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.personal_details DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.educations DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.experiences DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.language_activities DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.certifications DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.education_courses DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.awards DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.project_contributions DROP COLUMN IF EXISTS include_in_resume_default;
ALTER TABLE public.cover_letters DROP COLUMN IF EXISTS include_in_resume_default;

COMMIT;
