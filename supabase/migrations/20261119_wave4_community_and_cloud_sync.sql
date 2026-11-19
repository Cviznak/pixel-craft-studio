-- Wave 4: Pixel Craft Studio Community Feed, /p/:id Short Share Links & Cloud Sync
-- Target: Fresh Supabase PostgreSQL 15+ project
-- Security: Explicit minimal grants, RLS enabled on all tables, (select auth.uid()) caching, private trigger schema.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Helper trigger function for updated_at timestamps (SECURITY INVOKER)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. public.published_patterns (Community Feed & Unlisted /p/:short_id Links)
-- ============================================================================
create table if not exists public.published_patterns (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique check (short_id ~ '^[a-z0-9]{6,16}$'),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous Crafter' check (char_length(author_name) between 1 and 40),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  craft_type text not null check (craft_type in ('perler', 'cross-stitch', 'diamond', 'pixel', 'crochet', 'alpha', 'knitting', 'loom')),
  category text not null default 'Community' check (char_length(category) between 1 and 40),
  tags text[] not null default '{}',
  width integer not null check (width between 4 and 250),
  height integer not null check (height between 4 and 250),
  color_count integer not null check (color_count between 1 and 64),
  grid_rle text not null,
  palette jsonb not null,
  backstitches jsonb not null default '[]'::jsonb,
  bead_stitch_style text not null default 'loom' check (bead_stitch_style in ('loom', 'peyote', 'brick')),
  thumbnail_data_url text not null default '' check (char_length(thumbnail_data_url) <= 150000),
  is_public boolean not null default true,
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists published_patterns_public_recent_idx
  on public.published_patterns (created_at desc)
  where is_public = true;

create index if not exists published_patterns_public_craft_idx
  on public.published_patterns (craft_type, created_at desc)
  where is_public = true;

create index if not exists published_patterns_public_popular_idx
  on public.published_patterns (likes_count desc, created_at desc)
  where is_public = true;

create index if not exists published_patterns_author_idx
  on public.published_patterns (author_id)
  where author_id is not null;

drop trigger if exists trg_published_patterns_updated_at on public.published_patterns;
create trigger trg_published_patterns_updated_at
  before update on public.published_patterns
  for each row execute function public.set_updated_at();

alter table public.published_patterns enable row level security;

drop policy if exists "published_patterns_select_all" on public.published_patterns;
create policy "published_patterns_select_all"
  on public.published_patterns
  for select
  to anon, authenticated
  using (true);

drop policy if exists "published_patterns_insert_anon" on public.published_patterns;
create policy "published_patterns_insert_anon"
  on public.published_patterns
  for insert
  to anon
  with check (author_id is null);

drop policy if exists "published_patterns_insert_auth" on public.published_patterns;
create policy "published_patterns_insert_auth"
  on public.published_patterns
  for insert
  to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "published_patterns_update_own" on public.published_patterns;
create policy "published_patterns_update_own"
  on public.published_patterns
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists "published_patterns_delete_own" on public.published_patterns;
create policy "published_patterns_delete_own"
  on public.published_patterns
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ============================================================================
-- 2. public.pattern_likes (1-per-user likes synced to published_patterns)
-- ============================================================================
create table if not exists public.pattern_likes (
  pattern_id uuid not null references public.published_patterns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pattern_id, user_id)
);

create index if not exists pattern_likes_user_idx
  on public.pattern_likes (user_id);

alter table public.pattern_likes enable row level security;

drop policy if exists "pattern_likes_select_all" on public.pattern_likes;
create policy "pattern_likes_select_all"
  on public.pattern_likes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "pattern_likes_insert_own" on public.pattern_likes;
create policy "pattern_likes_insert_own"
  on public.pattern_likes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "pattern_likes_delete_own" on public.pattern_likes;
create policy "pattern_likes_delete_own"
  on public.pattern_likes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.sync_pattern_likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.published_patterns
      set likes_count = likes_count + 1
      where id = new.pattern_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.published_patterns
      set likes_count = greatest(0, likes_count - 1)
      where id = old.pattern_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function private.sync_pattern_likes_count() from public, anon, authenticated;

drop trigger if exists trg_pattern_likes_sync on public.pattern_likes;
create trigger trg_pattern_likes_sync
  after insert or delete on public.pattern_likes
  for each row execute function private.sync_pattern_likes_count();

-- ============================================================================
-- 3. public.cloud_projects (Cross-Device Cloud Vault Sync)
-- ============================================================================
create table if not exists public.cloud_projects (
  id text not null check (char_length(id) between 1 and 100),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  craft_type text not null check (craft_type in ('perler', 'cross-stitch', 'diamond', 'pixel', 'crochet', 'alpha', 'knitting', 'loom')),
  width integer not null check (width between 4 and 250),
  height integer not null check (height between 4 and 250),
  color_count integer not null default 0,
  grid_config jsonb not null,
  grid_rle text not null,
  palette jsonb not null,
  completed_cells jsonb not null default '{}'::jsonb,
  backstitches jsonb not null default '[]'::jsonb,
  thumbnail_data_url text not null default '' check (char_length(thumbnail_data_url) <= 150000),
  client_updated_at bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists cloud_projects_user_updated_idx
  on public.cloud_projects (user_id, client_updated_at desc);

drop trigger if exists trg_cloud_projects_updated_at on public.cloud_projects;
create trigger trg_cloud_projects_updated_at
  before update on public.cloud_projects
  for each row execute function public.set_updated_at();

alter table public.cloud_projects enable row level security;

drop policy if exists "cloud_projects_select_own" on public.cloud_projects;
create policy "cloud_projects_select_own"
  on public.cloud_projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "cloud_projects_insert_own" on public.cloud_projects;
create policy "cloud_projects_insert_own"
  on public.cloud_projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "cloud_projects_update_own" on public.cloud_projects;
create policy "cloud_projects_update_own"
  on public.cloud_projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "cloud_projects_delete_own" on public.cloud_projects;
create policy "cloud_projects_delete_own"
  on public.cloud_projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- 4. public.user_cloud_preferences (Floss/Bead Stash, Favorites & WIP Journal)
-- ============================================================================
create table if not exists public.user_cloud_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  dmc_stash text[] not null default '{}',
  perler_stash text[] not null default '{}',
  favorite_pattern_ids text[] not null default '{}',
  wip_stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_cloud_preferences_updated_at on public.user_cloud_preferences;
create trigger trg_user_cloud_preferences_updated_at
  before update on public.user_cloud_preferences
  for each row execute function public.set_updated_at();

alter table public.user_cloud_preferences enable row level security;

drop policy if exists "user_cloud_prefs_select_own" on public.user_cloud_preferences;
create policy "user_cloud_prefs_select_own"
  on public.user_cloud_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_cloud_prefs_insert_own" on public.user_cloud_preferences;
create policy "user_cloud_prefs_insert_own"
  on public.user_cloud_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_cloud_prefs_update_own" on public.user_cloud_preferences;
create policy "user_cloud_prefs_update_own"
  on public.user_cloud_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_cloud_prefs_delete_own" on public.user_cloud_preferences;
create policy "user_cloud_prefs_delete_own"
  on public.user_cloud_preferences
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- Explicit Minimal Role Privileges for Supabase Data API
-- ============================================================================
grant usage on schema public to anon, authenticated;

revoke all on public.published_patterns, public.pattern_likes, public.cloud_projects, public.user_cloud_preferences from public, anon, authenticated;

grant select, insert on public.published_patterns to anon;
grant select, insert, update, delete on public.published_patterns to authenticated;

grant select on public.pattern_likes to anon;
grant select, insert, delete on public.pattern_likes to authenticated;

grant select, insert, update, delete on public.cloud_projects to authenticated;
grant select, insert, update, delete on public.user_cloud_preferences to authenticated;
