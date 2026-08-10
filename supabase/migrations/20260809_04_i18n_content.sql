-- 🌐 CONTENT I18N MIGRATION 🌐
-- Run this in your Supabase SQL Editor to let posts, projects and categories
-- carry an English translation alongside the Korean original.
--
-- The UI chrome is English-only; the language toggle in the navbar switches the
-- language of the *content* rendered from these tables.
--
-- Safe to run before deploying the matching code: every column is nullable with
-- no backfill, so existing rows are untouched and the app keeps reading the base
-- columns exactly as it does today.

-- The existing columns hold the Korean original. `_en` is the optional English
-- translation; when it is NULL the app falls back to the original (see
-- i18n/localize.ts `pick()`), so the site reads the same until a translation is
-- actually written in the admin panel.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_en       text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS content_en     text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title_en       text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS content_en     text;

-- 9 of the 10 categories are already technology names (Algorithm, Django,
-- PyTorch…) and need no translation; this exists for the ones that do, like 회고.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_en text;

-- Deliberately NOT translated:
--   * `slug` on posts and categories — URLs must stay stable across languages.
--   * `stack` / `tags` arrays on projects — technology names, identical in both.
--
-- No RLS changes needed: every existing policy is table-scoped, so the new
-- columns inherit them.
