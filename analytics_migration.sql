-- Create daily_stats table for simple analytics
CREATE TABLE IF NOT EXISTS public.daily_stats (
    date date NOT NULL DEFAULT CURRENT_DATE PRIMARY KEY,
    views integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update (increment) views via Server Actions
-- Note: In a real production app, we might want stricter controls or an edge function.
-- For this portfolio, we will control access via the Server Action's logic (Service Role is used in Server Actions usually, but let's be safe).

CREATE POLICY "Allow public read access"
ON public.daily_stats
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow update access via server action"
ON public.daily_stats
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Allow insert access via server action"
ON public.daily_stats
FOR INSERT
TO public
WITH CHECK (true);
