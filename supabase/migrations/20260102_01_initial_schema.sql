-- Create Profile Table
create table public.profile (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  bio text,
  avatar_url text,
  resume_url text,
  social_links jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Projects Table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stack text[],
  date text,
  image_url text,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profile enable row level security;
alter table public.projects enable row level security;

-- Create Policies (Allow Public Read, Allow Anon Write for Demo Purpose)
-- WARNING: In production, Write should be restricted to authenticated users only.
create policy "Public Usage" on public.profile for all using (true);
create policy "Public Usage" on public.projects for all using (true);

-- Insert Dummy Profile Data (Optional)
insert into public.profile (name, role, bio)
values ('Yun Jong Seo', 'Full Stack Developer', '데이터가 이끄는 정확한 설계와 감각적인 인터페이스의 조화를 추구합니다.');
