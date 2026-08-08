-- 🗂️ BLOG CATEGORIES MIGRATION 🗂️
-- Run this in your Supabase SQL Editor to replace post tags with categories.
-- Mirrors the conventions in blog_migration.sql (posts table).
--
-- ⚠️ Run this BEFORE deploying the matching code. The app expects `category_id`
--    and no longer sends `tags`, so deploying first breaks post saving.
-- ⚠️ Step 4 drops data. Run steps 1-3, eyeball the result, then run 4.

-- 1. Create Categories Table ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,          -- URL-safe ASCII slug used in /blog?category=
  sort_order int NOT NULL DEFAULT 0,  -- Display order in the blog filter row
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);

-- 2. Link Posts to Categories ------------------------------------------------
-- One category per post. ON DELETE SET NULL: deleting a category leaves its
-- posts uncategorized rather than deleting them.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_category_id_idx ON public.posts (category_id);

-- 3. Migrate existing tags ---------------------------------------------------
-- Each post's FIRST tag becomes its category. Remaining tags are dropped in step 4.
INSERT INTO public.categories (name, slug)
SELECT DISTINCT
  tags[1],
  trim(both '-' from lower(regexp_replace(tags[1], '[^a-zA-Z0-9]+', '-', 'g')))
FROM public.posts
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (slug) DO NOTHING;

UPDATE public.posts p
SET category_id = c.id
FROM public.categories c
WHERE p.tags IS NOT NULL
  AND array_length(p.tags, 1) > 0
  AND c.name = p.tags[1];

-- Check before continuing:
--   SELECT p.title, c.name, c.slug FROM public.posts p
--   LEFT JOIN public.categories c ON c.id = p.category_id;
-- Korean-only tag names slugify to an empty string. Any category with a blank
-- slug needs a manual name/slug fix in /admin/categories after this runs.

-- 4. Drop the old tags column ------------------------------------------------
-- Only run once step 3 looks correct.
ALTER TABLE public.posts DROP COLUMN IF EXISTS tags;

-- 5. Row Level Security ------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can READ every category — the blog filter row must show categories
-- even when they have no published posts yet.
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories"
ON public.categories FOR SELECT
USING (true);

-- Only AUTHENTICATED users (admin) can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin Write Categories" ON public.categories;
CREATE POLICY "Admin Write Categories"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. (Optional) Seed categories for a fresh install --------------------------
-- INSERT INTO public.categories (name, slug, sort_order) VALUES
--   ('개발', 'dev', 1),
--   ('회고', 'retrospective', 2),
--   ('일상', 'daily', 3)
-- ON CONFLICT (slug) DO NOTHING;
