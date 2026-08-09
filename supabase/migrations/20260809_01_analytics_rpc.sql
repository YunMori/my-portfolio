-- 📈 ANALYTICS COUNTER RPC 📈
-- Run this in your Supabase SQL Editor. Requires 20260104_01_analytics.sql (daily_stats) first.
--
-- app/actions.ts has always called `supabase.rpc('increment_view', { target_date })`,
-- but the function was never created. Every call failed and fell through to a
-- `upsert({ views: 1 }, { ignoreDuplicates: true })` fallback, which records the
-- day's FIRST view and silently drops every later one — so every bar in the admin
-- chart was stuck at 0 or 1. This adds the missing function.
--
-- Safe to run more than once (CREATE OR REPLACE). No code change needed: the
-- argument name `target_date` matches what the Server Action already sends.

CREATE OR REPLACE FUNCTION public.increment_view(target_date date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.daily_stats (date, views)
  VALUES (target_date, 1)
  ON CONFLICT (date) DO UPDATE SET views = public.daily_stats.views + 1;
$$;

-- Anonymous visitors are the ones being counted, so `anon` must be able to call it.
GRANT EXECUTE ON FUNCTION public.increment_view(date) TO anon, authenticated;

-- Verify:
--   SELECT public.increment_view(CURRENT_DATE);
--   SELECT * FROM public.daily_stats ORDER BY date DESC LIMIT 7;

-- (Optional hardening — NOT run as part of this change) ----------------------
-- The function is SECURITY DEFINER, so it keeps working even without the broad
-- public write policies on daily_stats. Once you have confirmed the RPC path
-- works, these policies can go, leaving public read + RPC-only writes:
--
-- DROP POLICY IF EXISTS "Allow update access via server action" ON public.daily_stats;
-- DROP POLICY IF EXISTS "Allow insert access via server action" ON public.daily_stats;
