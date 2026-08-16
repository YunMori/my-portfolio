-- resume_versions RLS: auth.uid()를 (select auth.uid())로 감싼다.
--
-- 인라인으로 쓰면 Postgres가 행마다 다시 평가한다. select로 감싸면 InitPlan으로 한 번만
-- 계산되고 이후 행 필터는 상수 비교가 된다. 다른 이력서 테이블들은 이미 이 형태이고,
-- Supabase performance advisor의 auth_rls_initplan 경고가 이 정책 하나에만 남아 있었다.
-- See https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

ALTER POLICY "Owner all resume_versions" ON public.resume_versions
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);
