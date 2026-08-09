-- 📝 BLOG (posts) TABLE MIGRATION 📝
-- Run this in your Supabase SQL Editor to enable the tech blog feature.
-- Mirrors the conventions in 20260102_01_initial_schema.sql / 20260104_02_secure_policies.sql (projects table).

-- 1. Create Posts Table -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content text,                       -- Markdown body
  tags text[],
  published boolean NOT NULL DEFAULT true,
  date text,                          -- Display date 'YYYY.MM.DD'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helpful index for slug lookups
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts (slug);

-- 2. Enable Row Level Security ----------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Policies ---------------------------------------------------------------
-- Everyone can READ only PUBLISHED posts
DROP POLICY IF EXISTS "Public Read Posts" ON public.posts;
CREATE POLICY "Public Read Posts"
ON public.posts FOR SELECT
USING (published = true);

-- Only AUTHENTICATED users (admin) can INSERT/UPDATE/DELETE (and read drafts)
DROP POLICY IF EXISTS "Admin Write Posts" ON public.posts;
CREATE POLICY "Admin Write Posts"
ON public.posts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. (Optional) Seed a sample post ------------------------------------------
-- INSERT INTO public.posts (title, slug, description, tags, date, content)
-- VALUES (
--   '기록하며 배우기 시작합니다',
--   'hello-blog',
--   '이 블로그를 왜, 어떻게 만들었는지에 대한 첫 글.',
--   ARRAY['회고','Next.js'],
--   '2026.07.10',
--   E'## 왜 블로그인가\n\n배운 것을 남기기 위해...\n\n## 스택\n\nNext.js + Supabase.'
-- );
