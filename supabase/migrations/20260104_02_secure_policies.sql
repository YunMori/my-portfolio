-- 🚨 SECURITY HARDENING SCRIPT 🚨
-- Run this in your Supabase SQL Editor to fix vulnerabilities.

-- 1. Secure Profile Table ---------------------------------------------------
-- Drop insecure "Public Usage" policy if exists
DROP POLICY IF EXISTS "Public Usage" ON public.profile;

-- Allow EVERYONE to READ profile (Select)
CREATE POLICY "Public Read Profile"
ON public.profile FOR SELECT
USING (true);

-- Allow ONLY AUTHENTICATED USERS (Admin) to INSERT/UPDATE/DELETE
CREATE POLICY "Admin Write Profile"
ON public.profile FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. Secure Projects Table --------------------------------------------------
DROP POLICY IF EXISTS "Public Usage" ON public.projects;

-- Allow EVERYONE to READ projects
CREATE POLICY "Public Read Projects"
ON public.projects FOR SELECT
USING (true);

-- Allow ONLY AUTHENTICATED USERS to INSERT/UPDATE/DELETE
CREATE POLICY "Admin Write Projects"
ON public.projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 3. Secure Analytics Table -------------------------------------------------
-- Ensure table exists first (Fix for "relation does not exist" error)
CREATE TABLE IF NOT EXISTS public.daily_stats (
    date date NOT NULL DEFAULT CURRENT_DATE PRIMARY KEY,
    views integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing loose policies
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_stats;
DROP POLICY IF EXISTS "Allow update access via server action" ON public.daily_stats;
DROP POLICY IF EXISTS "Allow insert access via server action" ON public.daily_stats;

-- Allow EVERYONE to READ stats (e.g. for Admin Dashboard fetch)
CREATE POLICY "Public Read Stats" 
ON public.daily_stats FOR SELECT 
USING (true);

-- Allow EVERYONE to INSERT/UPDATE (Required for incrementView to work for visitors)
-- NOTE: We explicitly DO NOT create a DELETE policy for public.
-- This prevents anonymous users from deleting analytics data.
CREATE POLICY "Public Insert Stats" 
ON public.daily_stats FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public Update Stats" 
ON public.daily_stats FOR UPDATE 
USING (true);
