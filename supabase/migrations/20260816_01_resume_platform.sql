-- 📄 RESUME PLATFORM MIGRATION 📄
--
-- ⚠️ 이 파일은 2026-08-16에 **소급 기록**된 것입니다. 여기 있는 테이블은 이미 원격
--    프로젝트에 적용되어 있습니다 (feature/resume-builder 작업 이전에 SQL Editor에서
--    직접 실행됨). 새로 실행할 필요는 없고, 스키마 이력을 남기기 위해 커밋합니다.
--    멱등이므로 새 환경을 구성할 때는 순서대로 그냥 실행하면 됩니다.
--
-- Run this in your Supabase SQL Editor to enable the resume archive + builder feature.
-- Mirrors the conventions in schema.sql / secure_policies.sql / blog_migration.sql.
-- 멱등(idempotent): 여러 번 실행해도 안전합니다.
--
-- ⚠️ 주의: SQL Editor에서 수동으로 데이터를 seed할 때는 user_id를 명시해야 합니다.
--    (SQL Editor는 postgres 권한으로 실행되어 auth.uid()가 NULL이기 때문)
--    앱의 서버 액션을 통한 insert는 DEFAULT auth.uid()로 자동 채워집니다.

-- 0. 공통: updated_at 자동 갱신 트리거 함수 -----------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 기존 테이블 확장 ---------------------------------------------------------

-- 1-1. profile: 이력서 "기본 정보" 필드 추가
--      (사진 = 기존 avatar_url, GitHub 링크 = 기존 social_links 재사용)
--      ⚠️ phone(전화번호)은 여기 넣지 않습니다 — profile은 공개 SELECT 정책이라
--         anon key로 조회 가능하므로, 전화번호는 비공개 personal_details에 저장합니다.
ALTER TABLE public.profile
    ADD COLUMN IF NOT EXISTS one_liner text,          -- 한 줄 소개
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS blog_url text,
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_profile_updated_at ON public.profile;
CREATE TRIGGER set_profile_updated_at
    BEFORE UPDATE ON public.profile
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1-2. projects: 이력서용 필드 + 공통 메타 필드 추가 (전부 additive — 기존 화면 무영향)
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS role text,               -- 프로젝트 내 역할
    ADD COLUMN IF NOT EXISTS period_start text,       -- 'YYYY.MM' (기존 date 컬럼 컨벤션)
    ADD COLUMN IF NOT EXISTS period_end text,         -- 'YYYY.MM' (NULL = 진행중)
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS include_in_resume_default boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects 공개 정책 교체: is_public = true 인 행만 익명 조회 가능
-- (신규 컬럼 기본값이 true라 기존 행 동작은 동일)
DROP POLICY IF EXISTS "Public Read Projects" ON public.projects;
CREATE POLICY "Public Read Projects"
ON public.projects FOR SELECT
USING (is_public = true);
-- 인증 사용자의 비공개 행 조회/수정은 기존 "Admin Write Projects" (FOR ALL) 정책이 커버

-- 2. 신규 테이블 --------------------------------------------------------------
-- 공통 메타 컬럼: user_id, is_public, include_in_resume_default,
--                display_order, tags, created_at, updated_at

-- 2-1. 인적 사항 (민감정보 — 공개 SELECT 정책 없음, 이력서 토글 기본 OFF)
CREATE TABLE IF NOT EXISTS public.personal_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    birth_date date,
    address text,
    military_service text,              -- 병역 (예: '육군 병장 만기전역')
    phone text,                         -- 전화번호 (민감정보라 profile이 아닌 여기)
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT false,
    include_in_resume_default boolean NOT NULL DEFAULT false,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-2. 학력 사항
CREATE TABLE IF NOT EXISTS public.educations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school text NOT NULL,
    major text,
    degree text,                        -- 학위 (예: '학사')
    status text CHECK (status IN ('재학', '휴학', '졸업예정', '졸업', '중퇴')),
    start_date text,                    -- 'YYYY.MM'
    end_date text,                      -- 'YYYY.MM'
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-3. 경력 사항
CREATE TABLE IF NOT EXISTS public.experiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company text NOT NULL,
    position text,                      -- 직무/직책
    start_date text,                    -- 'YYYY.MM'
    end_date text,                      -- 'YYYY.MM' (NULL = 재직중)
    summary text,
    achievements text[],                -- 주요 업무 및 성과 (불릿 리스트)
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-4. 어학/자격/활동
CREATE TABLE IF NOT EXISTS public.language_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type text CHECK (activity_type IN ('language', 'club', 'external')),
    name text NOT NULL,
    score_or_desc text,                 -- 점수 또는 설명
    activity_date text,                 -- 'YYYY.MM'
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-5. 자격증
CREATE TABLE IF NOT EXISTS public.certifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    issuer text,                        -- 발급기관
    acquired_date text,                 -- 'YYYY.MM'
    cert_number text,                   -- 자격증 번호 (선택)
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-6. 교육 이수 사항
CREATE TABLE IF NOT EXISTS public.education_courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name text NOT NULL,          -- 과정명 (예: 'SSAFY 12기')
    institution text,                   -- 기관
    start_date text,                    -- 'YYYY.MM'
    end_date text,                      -- 'YYYY.MM'
    summary text,                       -- 이수 내용 요약
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-7. 수상 경력
CREATE TABLE IF NOT EXISTS public.awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                 -- 대회/수상명
    awarded_date text,                  -- 'YYYY.MM'
    rank text,                          -- 순위/등급 (예: '대상', '2위')
    description text,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-8. 포트폴리오 상세 (프로젝트와 1:N)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_type text CHECK (item_type IN ('image', 'code', 'video')),
    title text,
    description text,
    image_url text,                     -- item_type = 'image'
    code_snippet text,                  -- item_type = 'code'
    code_language text,
    video_url text,                     -- item_type = 'video'
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT true,
    include_in_resume_default boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-9. 자기소개서 (민감정보 — 공개 여부 기본 OFF)
CREATE TABLE IF NOT EXISTS public.cover_letters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,                -- 지원 회사/용도 (예: '○○기업 상반기 공채')
    question text,                      -- 문항
    answer text,                        -- 답변
    char_limit int,                     -- 글자수 제한 (NULL = 제한 없음)
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public boolean NOT NULL DEFAULT false,
    include_in_resume_default boolean NOT NULL DEFAULT false,
    display_order int NOT NULL DEFAULT 0,
    tags text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2-10. 이력서 프리셋 (토글 조합 저장 — 본인 전용)
CREATE TABLE IF NOT EXISTS public.resume_presets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                 -- 프리셋 이름 (예: '백엔드 지원용')
    selections jsonb NOT NULL DEFAULT '{}',  -- { "educations": [id, ...], ..., "basic_fields": { "phone": false } }
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. 인덱스 / 트리거 -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS personal_details_order_idx ON public.personal_details (user_id, display_order);
CREATE INDEX IF NOT EXISTS educations_order_idx ON public.educations (user_id, display_order);
CREATE INDEX IF NOT EXISTS experiences_order_idx ON public.experiences (user_id, display_order);
CREATE INDEX IF NOT EXISTS language_activities_order_idx ON public.language_activities (user_id, display_order);
CREATE INDEX IF NOT EXISTS certifications_order_idx ON public.certifications (user_id, display_order);
CREATE INDEX IF NOT EXISTS education_courses_order_idx ON public.education_courses (user_id, display_order);
CREATE INDEX IF NOT EXISTS awards_order_idx ON public.awards (user_id, display_order);
CREATE INDEX IF NOT EXISTS portfolio_items_project_idx ON public.portfolio_items (project_id, display_order);
CREATE INDEX IF NOT EXISTS cover_letters_order_idx ON public.cover_letters (user_id, display_order);

DROP TRIGGER IF EXISTS set_personal_details_updated_at ON public.personal_details;
CREATE TRIGGER set_personal_details_updated_at BEFORE UPDATE ON public.personal_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_educations_updated_at ON public.educations;
CREATE TRIGGER set_educations_updated_at BEFORE UPDATE ON public.educations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_experiences_updated_at ON public.experiences;
CREATE TRIGGER set_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_language_activities_updated_at ON public.language_activities;
CREATE TRIGGER set_language_activities_updated_at BEFORE UPDATE ON public.language_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_certifications_updated_at ON public.certifications;
CREATE TRIGGER set_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_education_courses_updated_at ON public.education_courses;
CREATE TRIGGER set_education_courses_updated_at BEFORE UPDATE ON public.education_courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_awards_updated_at ON public.awards;
CREATE TRIGGER set_awards_updated_at BEFORE UPDATE ON public.awards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER set_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_cover_letters_updated_at ON public.cover_letters;
CREATE TRIGGER set_cover_letters_updated_at BEFORE UPDATE ON public.cover_letters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_resume_presets_updated_at ON public.resume_presets;
CREATE TRIGGER set_resume_presets_updated_at BEFORE UPDATE ON public.resume_presets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS ----------------------------------------------------------------------
ALTER TABLE public.personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_presets ENABLE ROW LEVEL SECURITY;

-- 4-1. 일반 카테고리: 공개 행만 익명 조회 + 소유자 전체 접근
--      (FOR ALL 은 SELECT 도 포함하므로 소유자는 비공개 행도 조회 가능)

-- educations
DROP POLICY IF EXISTS "Public Read Educations" ON public.educations;
CREATE POLICY "Public Read Educations" ON public.educations FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Educations" ON public.educations;
CREATE POLICY "Owner All Educations" ON public.educations FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- experiences
DROP POLICY IF EXISTS "Public Read Experiences" ON public.experiences;
CREATE POLICY "Public Read Experiences" ON public.experiences FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Experiences" ON public.experiences;
CREATE POLICY "Owner All Experiences" ON public.experiences FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- language_activities
DROP POLICY IF EXISTS "Public Read Language Activities" ON public.language_activities;
CREATE POLICY "Public Read Language Activities" ON public.language_activities FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Language Activities" ON public.language_activities;
CREATE POLICY "Owner All Language Activities" ON public.language_activities FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- certifications
DROP POLICY IF EXISTS "Public Read Certifications" ON public.certifications;
CREATE POLICY "Public Read Certifications" ON public.certifications FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Certifications" ON public.certifications;
CREATE POLICY "Owner All Certifications" ON public.certifications FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- education_courses
DROP POLICY IF EXISTS "Public Read Education Courses" ON public.education_courses;
CREATE POLICY "Public Read Education Courses" ON public.education_courses FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Education Courses" ON public.education_courses;
CREATE POLICY "Owner All Education Courses" ON public.education_courses FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- awards
DROP POLICY IF EXISTS "Public Read Awards" ON public.awards;
CREATE POLICY "Public Read Awards" ON public.awards FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Awards" ON public.awards;
CREATE POLICY "Owner All Awards" ON public.awards FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- portfolio_items
DROP POLICY IF EXISTS "Public Read Portfolio Items" ON public.portfolio_items;
CREATE POLICY "Public Read Portfolio Items" ON public.portfolio_items FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Owner All Portfolio Items" ON public.portfolio_items;
CREATE POLICY "Owner All Portfolio Items" ON public.portfolio_items FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4-2. 민감 테이블: 공개 SELECT 정책을 만들지 않음 → 익명 조회 시 0행
--      (personal_details: 생년월일/주소/병역/전화, cover_letters: 자기소개서, resume_presets)

DROP POLICY IF EXISTS "Owner All Personal Details" ON public.personal_details;
CREATE POLICY "Owner All Personal Details" ON public.personal_details FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner All Cover Letters" ON public.cover_letters;
CREATE POLICY "Owner All Cover Letters" ON public.cover_letters FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner All Resume Presets" ON public.resume_presets;
CREATE POLICY "Owner All Resume Presets" ON public.resume_presets FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
