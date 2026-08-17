-- 프로젝트 기여 명세 + projects.slug
--
-- 1) portfolio_items → project_contributions 로 재정의
--    기존 portfolio_items는 '디자인 이미지 / 코드 스니펫 / 데모 영상' 등록용 스키마였는데,
--    실제로 필요한 건 "이 프로젝트에서 내가 무엇을 했는가"다. code_snippet/code_language는
--    폼에서 받아 저장까지 했지만 어디에도 렌더되지 않았고, project_id는 저장만 될 뿐
--    프로젝트 제목으로 되돌려지는 곳이 없었다.
--    적용 시점 기준 portfolio_items 0행 / resume_versions 0행이라 스냅샷 호환을 신경 쓸
--    필요가 없어, 컬럼을 덧붙이는 대신 테이블을 새로 만든다.
--
-- 2) projects.slug 추가 — 공개 상세 페이지 /projects/[slug] 용
--
-- 기여 1건 = 1행 (프로젝트에 1:N). problem → actions → outcome 순의 STAR 구조를
-- 컬럼으로 고정해서, 웹 상세 페이지와 이력서 PDF가 같은 데이터를 쓴다.

-- 1. project_contributions ----------------------------------------------------

DROP TABLE IF EXISTS public.portfolio_items;

CREATE TABLE IF NOT EXISTS public.project_contributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,                -- 무엇을 했는가
    area text,                          -- 구분 (utils/resume/config.ts의 select 옵션)
    problem text,                       -- 문제 상황
    actions text[] DEFAULT '{}',        -- 한 일 (bullets)
    outcome text[] DEFAULT '{}',        -- 결과 (bullets)
    metric text,                        -- 대표 지표 한 줄 (예: '첫 렌더 3.2s → 0.4s')
    -- 공통 메타 (다른 아카이브 테이블과 동일)
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 상세 페이지는 프로젝트별로 display_order 순서대로 읽는다
CREATE INDEX IF NOT EXISTS project_contributions_project_idx
    ON public.project_contributions (project_id, display_order);

DROP TRIGGER IF EXISTS set_project_contributions_updated_at ON public.project_contributions;
CREATE TRIGGER set_project_contributions_updated_at
    BEFORE UPDATE ON public.project_contributions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_contributions ENABLE ROW LEVEL SECURITY;

-- 정책 두 가지 규칙:
--  1. auth.uid()는 반드시 (select ...)로 감싼다 — 인라인이면 행마다 재평가되어
--     performance advisor의 auth_rls_initplan 경고가 뜬다.
--  2. 커맨드별로 하나씩 만든다. "공개 읽기 + 소유자 FOR ALL" 조합은 authenticated의
--     SELECT에 permissive 정책이 둘 붙어 매 쿼리마다 둘 다 평가된다
--     (multiple_permissive_policies). SELECT는 OR 한 줄로 합친다.
--     다른 아카이브 테이블(awards 등)이 쓰는 형태와 동일하다.
CREATE POLICY "Read Project Contributions" ON public.project_contributions
    FOR SELECT USING (is_public = true OR (select auth.uid()) = user_id);

CREATE POLICY "Insert Project Contributions" ON public.project_contributions
    FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Update Project Contributions" ON public.project_contributions
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Delete Project Contributions" ON public.project_contributions
    FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- FK 커버링 인덱스 (advisor: unindexed_foreign_keys)
CREATE INDEX IF NOT EXISTS project_contributions_user_idx
    ON public.project_contributions (user_id, display_order);

-- 2. projects.slug ------------------------------------------------------------

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;

-- 기존 행 백필: 영숫자가 아닌 구간을 '-'로 접고 양끝 '-'를 떼어낸다.
-- 현재 제목은 전부 ASCII라 이 규칙으로 충분하다. 앞으로 들어올 한글 전용 제목은
-- 앱 쪽 postSlug() + project-${random} 폴백이 처리한다 (app/actions/projects.ts).
UPDATE public.projects
SET slug = trim(both '-' from lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE slug IS NULL OR slug = '';

-- 백필 후에도 비어 있는 행(예: 한글 전용 제목)은 id 앞자리로 채워 NOT NULL을 만족시킨다
UPDATE public.projects
SET slug = 'project-' || left(id::text, 8)
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.projects ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key ON public.projects (slug);
