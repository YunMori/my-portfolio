-- ⚡ DB OPTIMIZATION & HARDENING ⚡
-- ✅ ALREADY APPLIED to the remote project on 2026-08-09. Kept here so the repo
--    records what the live schema looks like, matching the other migrations in this directory
--    files. Every statement is idempotent, so re-running is harmless.
--
-- Clears every WARN-level Supabase advisor lint (performance + security) except
-- the two noted at the bottom, which cannot be fixed from SQL.


-- 1. Index cleanup -----------------------------------------------------------
-- Both tables had a plain btree on `slug` sitting next to the UNIQUE constraint's
-- index on the same column. The unique index already serves every lookup, so the
-- duplicate only cost write time and storage.
DROP INDEX IF EXISTS public.posts_slug_idx;
DROP INDEX IF EXISTS public.categories_slug_idx;

-- Foreign keys with no covering index: a delete on the parent has to seq-scan
-- the child. All four tables are empty today, so this is purely pre-emptive.
CREATE INDEX IF NOT EXISTS profile_user_id_idx         ON public.profile (user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx        ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS portfolio_items_user_id_idx ON public.portfolio_items (user_id);
CREATE INDEX IF NOT EXISTS resume_presets_user_id_idx  ON public.resume_presets (user_id);


-- 2. Function hardening ------------------------------------------------------
-- The body only calls now() (pg_catalog, always implicitly on the path), so an
-- empty search_path is safe and closes the mutable-search_path warning.
ALTER FUNCTION public.set_updated_at() SET search_path = '';


-- 3. RLS rewrite -------------------------------------------------------------
-- Two lint classes, fixed together because the fix for one changes the other:
--
--   auth_rls_initplan — a bare `auth.uid()` in a policy is re-evaluated once per
--   row. `(select auth.uid())` lets the planner hoist it into an InitPlan that
--   runs once per statement.
--
--   multiple_permissive_policies — a `FOR ALL` write policy also covers SELECT,
--   so it stacked with the public read policy and both were evaluated on every
--   authenticated read. Splitting writes into INSERT/UPDATE/DELETE and folding
--   the privileged read path into the single SELECT policy leaves exactly one
--   permissive policy per role+action.
--
-- Access semantics are unchanged: admins still read unpublished posts and
-- non-public projects, owners still read their own private rows.

-- 3a. Owner-only tables (no public read policy) — nothing stacks, so FOR ALL
--     stays and only the initplan wrapping changes.
DROP POLICY IF EXISTS "Owner All Personal Details" ON public.personal_details;
CREATE POLICY "Owner All Personal Details" ON public.personal_details
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owner All Cover Letters" ON public.cover_letters;
CREATE POLICY "Owner All Cover Letters" ON public.cover_letters
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owner All Resume Presets" ON public.resume_presets;
CREATE POLICY "Owner All Resume Presets" ON public.resume_presets
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- 3b. Owner + public-read tables. Identical shape on all seven, so applied in a
--     loop rather than copied out seven times. Result per table:
--       SELECT (public)        : row is public, OR the caller owns it
--       I/U/D  (authenticated) : caller owns it
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'awards', 'certifications', 'education_courses', 'educations',
    'experiences', 'language_activities', 'portfolio_items'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Owner All '   || initcap(replace(t, '_', ' ')), t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Public Read ' || initcap(replace(t, '_', ' ')), t);
    -- Re-runnable: drop the new names too before recreating them.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Read '   || initcap(replace(t, '_', ' ')), t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Insert ' || initcap(replace(t, '_', ' ')), t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Update ' || initcap(replace(t, '_', ' ')), t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Delete ' || initcap(replace(t, '_', ' ')), t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT TO public
      USING (is_public = true OR (select auth.uid()) = user_id)
    $f$, 'Read ' || initcap(replace(t, '_', ' ')), t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
      WITH CHECK ((select auth.uid()) = user_id)
    $f$, 'Insert ' || initcap(replace(t, '_', ' ')), t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
      USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)
    $f$, 'Update ' || initcap(replace(t, '_', ' ')), t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
      USING ((select auth.uid()) = user_id)
    $f$, 'Delete ' || initcap(replace(t, '_', ' ')), t);
  END LOOP;
END $$;

-- 3c. Single-admin tables, where the write policy was an unconditional `true`.
--     Supersedes the "Admin Write X" policies from 20260104_02_secure_policies.sql.

-- Public read was already unconditional on these three, so only writes split.
DROP POLICY IF EXISTS "Admin Write Categories" ON public.categories;
DROP POLICY IF EXISTS "Insert Categories" ON public.categories;
DROP POLICY IF EXISTS "Update Categories" ON public.categories;
DROP POLICY IF EXISTS "Delete Categories" ON public.categories;
CREATE POLICY "Insert Categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Categories" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete Categories" ON public.categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin Write Post Categories" ON public.post_categories;
DROP POLICY IF EXISTS "Insert Post Categories" ON public.post_categories;
DROP POLICY IF EXISTS "Update Post Categories" ON public.post_categories;
DROP POLICY IF EXISTS "Delete Post Categories" ON public.post_categories;
CREATE POLICY "Insert Post Categories" ON public.post_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Post Categories" ON public.post_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete Post Categories" ON public.post_categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin Write Profile" ON public.profile;
DROP POLICY IF EXISTS "Insert Profile" ON public.profile;
DROP POLICY IF EXISTS "Update Profile" ON public.profile;
DROP POLICY IF EXISTS "Delete Profile" ON public.profile;
CREATE POLICY "Insert Profile" ON public.profile FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Profile" ON public.profile FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete Profile" ON public.profile FOR DELETE TO authenticated USING (true);

-- posts: the admin panel lists drafts (getAllPostsAdmin), which previously
-- worked only because "Admin Write Posts" was FOR ALL. Now stated explicitly.
DROP POLICY IF EXISTS "Admin Write Posts" ON public.posts;
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
DROP POLICY IF EXISTS "Read Posts" ON public.posts;
DROP POLICY IF EXISTS "Insert Posts" ON public.posts;
DROP POLICY IF EXISTS "Update Posts" ON public.posts;
DROP POLICY IF EXISTS "Delete Posts" ON public.posts;
CREATE POLICY "Read Posts" ON public.posts FOR SELECT TO public
  USING (published = true OR (select auth.uid()) IS NOT NULL);
CREATE POLICY "Insert Posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Posts" ON public.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete Posts" ON public.posts FOR DELETE TO authenticated USING (true);

-- projects: same reasoning, for is_public = false rows.
DROP POLICY IF EXISTS "Admin Write Projects" ON public.projects;
DROP POLICY IF EXISTS "Public Read Projects" ON public.projects;
DROP POLICY IF EXISTS "Read Projects" ON public.projects;
DROP POLICY IF EXISTS "Insert Projects" ON public.projects;
DROP POLICY IF EXISTS "Update Projects" ON public.projects;
DROP POLICY IF EXISTS "Delete Projects" ON public.projects;
CREATE POLICY "Read Projects" ON public.projects FOR SELECT TO public
  USING (is_public = true OR (select auth.uid()) IS NOT NULL);
CREATE POLICY "Insert Projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update Projects" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Delete Projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- Verify (should return exactly the published posts, and no drafts):
--   SET LOCAL ROLE anon; SELECT count(*) FROM public.posts;


-- 4. posts.date: text → date -------------------------------------------------
-- ⚠️ Ships with matching code changes. Deploy them together.
--
-- The column was free text holding values like '2026, 07, 10'. Ordering worked
-- only by accident of that format being fixed-width and year-first, and nothing
-- stopped a typo from being stored.
--
-- The USING clause strips every non-digit before parsing, so '2026, 07, 10',
-- '2026.07.10' and '2026-07-10' all convert identically. Anything that does not
-- reduce to 8 digits becomes NULL rather than aborting the migration — the
-- column is already nullable.
ALTER TABLE public.posts
  ALTER COLUMN date TYPE date
  USING CASE
    WHEN regexp_replace(coalesce(date::text, ''), '[^0-9]', '', 'g') ~ '^\d{8}$'
      THEN to_date(regexp_replace(date::text, '[^0-9]', '', 'g'), 'YYYYMMDD')
    ELSE NULL
  END;

-- The API now returns 'YYYY-MM-DD', so the app renders dates through
-- formatPostDate() (utils/post.ts) and the admin form uses <input type="date">.


-- Deliberately NOT done -------------------------------------------------------
-- • The `*_order_idx` indexes flagged as "unused" are kept. They read as unused
--   only because their tables are still empty; they exist for the ordering the
--   resume feature will do once it holds rows.
-- • Leaked-password protection (HaveIBeenPwned check) is an Auth dashboard
--   setting, not SQL: Authentication → Policies → enable it there.
