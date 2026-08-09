-- 🗂️ MULTI-CATEGORY MIGRATION 🗂️
-- Run this in your Supabase SQL Editor to let a post belong to several categories.
-- Requires 20260808_01_categories.sql (categories table + posts.category_id) first.
--
-- ⚠️ Run this BEFORE deploying the matching code. The app reads/writes the
--    `post_categories` join table and no longer sends `category_id`, so deploying
--    first breaks post saving.
-- ⚠️ Step 4 drops a column. Run steps 1-3, eyeball the result, then run 4.

-- 1. Join table --------------------------------------------------------------
-- Composite PK doubles as the uniqueness guard: a post can't hold the same
-- category twice. CASCADE both ways — deleting a post or a category should only
-- remove the link, never the other side.
CREATE TABLE IF NOT EXISTS public.post_categories (
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- The PK already indexes (post_id, ...); this one serves the reverse lookup
-- used by /blog?category= filtering.
CREATE INDEX IF NOT EXISTS post_categories_category_id_idx
  ON public.post_categories (category_id);

-- 2. Backfill from the old single-category column ----------------------------
INSERT INTO public.post_categories (post_id, category_id)
SELECT id, category_id
FROM public.posts
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Check before continuing:
--   SELECT p.title, c.name FROM public.posts p
--   JOIN public.post_categories pc ON pc.post_id = p.id
--   JOIN public.categories c ON c.id = pc.category_id
--   ORDER BY p.title;

-- 3. Row Level Security ------------------------------------------------------
-- Mirrors the categories table: everyone reads, only admin writes.
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Post Categories" ON public.post_categories;
CREATE POLICY "Public Read Post Categories"
ON public.post_categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin Write Post Categories" ON public.post_categories;
CREATE POLICY "Admin Write Post Categories"
ON public.post_categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Drop the old single-category column -------------------------------------
-- ⏳ NOT RUN YET. Steps 1-3 were applied on 2026-08-09 (6 posts backfilled,
--    every one kept its category). Run this only after the app has been
--    exercised against the new schema — it is irreversible.
-- Only run once step 2 looks correct. The app stops reading this column.
ALTER TABLE public.posts DROP COLUMN IF EXISTS category_id;
