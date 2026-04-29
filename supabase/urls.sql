-- ============================================================
-- CONTENT URLS
-- Run once in Supabase SQL Editor
-- After this, edit URLs directly in Table Editor (no redeploy needed)
-- ============================================================

-- Add video_url column to existing lessons table
alter table lessons add column if not exists video_url text not null default '';

-- Table for material download/view URLs
create table if not exists material_urls (
  material_id int  primary key,
  url         text not null default ''
);

-- Seed all 27 material slots (update URLs in Table Editor later)
insert into material_urls (material_id, url) values
  (1,  ''), (2,  ''), (3,  ''), (4,  ''), (5,  ''), (6,  ''),
  (7,  ''), (8,  ''), (9,  ''), (10, ''), (11, ''), (12, ''),
  (13, ''), (14, ''), (15, ''), (16, ''), (17, ''), (18, ''),
  (19, ''), (20, ''), (21, ''), (22, ''), (23, ''), (24, ''),
  (25, ''), (26, ''), (27, '')
on conflict (material_id) do nothing;

-- RLS: authenticated users can read
alter table material_urls enable row level security;

create policy "authenticated read material_urls"
  on material_urls for select
  to authenticated
  using (true);
