-- Wave 5: Creator Mini-Profiles, Remix Lineage & Community Build Tips / Comments
-- Apply in Supabase SQL Editor after Wave 4 migration.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ============================================================================
-- 1. Remix Attribution Columns & Counter on public.published_patterns
-- ============================================================================
alter table public.published_patterns
  add column if not exists remixed_from_short_id text,
  add column if not exists remixed_from_title text not null default '',
  add column if not exists remixes_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'published_patterns_remixes_count_check'
  ) then
    alter table public.published_patterns
      add constraint published_patterns_remixes_count_check check (remixes_count >= 0);
  end if;
end $$;

create index if not exists published_patterns_public_author_name_idx
  on public.published_patterns (author_name, created_at desc)
  where is_public = true;

create index if not exists published_patterns_remixed_from_idx
  on public.published_patterns (remixed_from_short_id)
  where remixed_from_short_id is not null;

create or replace function private.sync_pattern_remixes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.remixed_from_short_id is not null then
    update public.published_patterns
      set remixes_count = remixes_count + 1
      where short_id = new.remixed_from_short_id;
    return new;
  elsif tg_op = 'DELETE' and old.remixed_from_short_id is not null then
    update public.published_patterns
      set remixes_count = greatest(0, remixes_count - 1)
      where short_id = old.remixed_from_short_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function private.sync_pattern_remixes_count() from public, anon, authenticated;

drop trigger if exists trg_published_patterns_remix_sync on public.published_patterns;
create trigger trg_published_patterns_remix_sync
  after insert or delete on public.published_patterns
  for each row execute function private.sync_pattern_remixes_count();

-- ============================================================================
-- 2. public.pattern_comments (Build Tips, Thread Substitutions & Feedback)
-- ============================================================================
create table if not exists public.pattern_comments (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references public.published_patterns(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Studio Crafter' check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(trim(body)) between 2 and 400),
  created_at timestamptz not null default now()
);

create index if not exists pattern_comments_pattern_created_idx
  on public.pattern_comments (pattern_id, created_at desc);

create index if not exists pattern_comments_author_idx
  on public.pattern_comments (author_id);

alter table public.pattern_comments enable row level security;

drop policy if exists "pattern_comments_select_all" on public.pattern_comments;
create policy "pattern_comments_select_all"
  on public.pattern_comments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "pattern_comments_insert_own" on public.pattern_comments;
create policy "pattern_comments_insert_own"
  on public.pattern_comments
  for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

drop policy if exists "pattern_comments_delete_own" on public.pattern_comments;
create policy "pattern_comments_delete_own"
  on public.pattern_comments
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ============================================================================
-- Explicit Minimal Privileges for Supabase Data API
-- ============================================================================
grant usage on schema public to anon, authenticated;
revoke all on public.pattern_comments from public, anon, authenticated;
grant select on public.pattern_comments to anon;
grant select, insert, delete on public.pattern_comments to authenticated;
