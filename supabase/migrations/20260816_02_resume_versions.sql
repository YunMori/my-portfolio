-- 📄 RESUME VERSIONS 📄
-- 이력서 "버전 관리" — 저장 시점의 내용 전체를 동결한 스냅샷 이력.
-- 멱등(idempotent): 여러 번 실행해도 안전합니다.
--
-- 프리셋(resume_presets)과의 차이:
--   프리셋은 "어떤 항목을 포함할지" 선택 조합만 저장하므로, 나중에 아카이브를 고치면
--   과거에 뽑았던 이력서 내용도 같이 바뀐다. 버전은 selections 뿐 아니라 그 시점의
--   ResumeData 전체(snapshot)를 들고 있어서, "A사에 제출한 그 이력서"가 그대로 남는다.

-- 1. resume_versions ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- SQL Editor에서 수동 insert 할 때는 auth.uid()가 NULL이므로 user_id를 명시해야 합니다.
    user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    version_no  int  NOT NULL,                 -- 사용자별 1부터 증가 (saveVersion에서 max+1)
    label       text,                          -- "백엔드 신입 지원용"
    note        text,                          -- 제출처 / 메모
    selections  jsonb NOT NULL,                -- 편집 재개용 토글 상태 (ResumeSelections)
    snapshot    jsonb NOT NULL,                -- 저장 시점 ResumeData 전체 (불변)
    created_at  timestamptz NOT NULL DEFAULT now(),
    -- 동시 저장 경합 시 두 번째 insert가 여기서 걸린다 (단일 관리자라 사실상 발생 안 함)
    CONSTRAINT resume_versions_user_version_key UNIQUE (user_id, version_no)
);

-- 목록 조회는 항상 "내 버전을 최신순으로"
CREATE INDEX IF NOT EXISTS resume_versions_user_created_idx
    ON public.resume_versions (user_id, created_at DESC);

-- 2. RLS ---------------------------------------------------------------------
-- snapshot 안에 전화번호/생년월일/주소/병역 같은 민감 정보가 그대로 들어가므로
-- personal_details / cover_letters 와 같은 등급인 "소유자 전용"으로 잠근다.
-- (20260809_03_db_optimization.sql §3a 와 동일한 스타일)
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner all resume_versions" ON public.resume_versions;
CREATE POLICY "Owner all resume_versions" ON public.resume_versions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. 프리셋 폐기 --------------------------------------------------------------
-- 스냅샷 버전이 프리셋의 상위 호환이라 채택하지 않았습니다.
-- 실행 시점에 0행이었고 앱 코드 어디서도 참조하지 않습니다.
DROP TABLE IF EXISTS public.resume_presets;
