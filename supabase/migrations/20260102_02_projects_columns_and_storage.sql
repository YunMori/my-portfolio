-- Add new columns to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'github_link') THEN
        ALTER TABLE public.projects ADD COLUMN github_link text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'content') THEN
        ALTER TABLE public.projects ADD COLUMN content text;
    END IF;
END $$;

-- Enable Storage (This needs to be done via UI usually, but bucket creation SQL helps if extension active)
-- Create a bucket for 'images' if not exists
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Set up storage policy (Public Read, Auth Write)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Auth Update"
  on storage.objects for update
  using ( bucket_id = 'images' and auth.role() = 'authenticated' );
