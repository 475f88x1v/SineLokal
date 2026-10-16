-- SineLokal Supabase schema
-- Run in Supabase SQL Editor. Uses auth.uid() and Row Level Security.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'SineLokal member',
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  genre text not null,
  year integer check (year is null or year between 1890 and 2100),
  duration text,
  description text not null default '',
  poster_url text,
  youtube_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id uuid not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists movies_genre_idx on public.movies (genre);
create index if not exists movies_featured_idx on public.movies (featured) where featured = true;
create index if not exists favorites_user_idx on public.favorites (user_id);

-- Automatically create a regular user profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'SineLokal member'),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER helper avoids recursive profile RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.favorites enable row level security;

-- Profiles: a user can read/update their own non-role profile fields; admins can read all.
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can update own profile fields" on public.profiles;
create policy "Users can update own profile fields" on public.profiles
for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

-- Movies: public can browse; only admins can insert/update/delete.
drop policy if exists "Anyone can read movies" on public.movies;
create policy "Anyone can read movies" on public.movies
for select to anon, authenticated using (true);

drop policy if exists "Admins can insert movies" on public.movies;
create policy "Admins can insert movies" on public.movies
for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins can update movies" on public.movies;
create policy "Admins can update movies" on public.movies
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete movies" on public.movies;
create policy "Admins can delete movies" on public.movies
for delete to authenticated using (public.is_admin());

-- Favorites: each authenticated user can manage only their own rows.
drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites" on public.favorites
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can add own favorites" on public.favorites;
create policy "Users can add own favorites" on public.favorites
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can remove own favorites" on public.favorites
for delete to authenticated using (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.movies to anon, authenticated;
grant insert, update, delete on public.movies to authenticated;
grant select, insert on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- Optional sample seed (uncomment after uploading posters or leave poster_url as paths).
-- insert into public.movies (title, genre, year, duration, description, poster_url, youtube_url, featured)
-- values
-- ('Way Back Home', 'Drama', 2011, '1h 43m', 'A Filipino family drama about love, sacrifice, and connection.', 'assets/images/posters/way-back-home.jpg', 'https://youtu.be/aw2njSud6Vo?si=4-zvNWYbk0rs3GY_', true),
-- ('Can''t Help Falling in Love', 'Romance', 2017, '1h 55m', 'A romantic comedy about unexpected connections and love.', 'assets/images/posters/cant-help-falling-in-love.jpg', 'https://youtu.be/WqA6UQnsTtc?si=4Ur6h95WJWo5QOLb', true),
-- ('Petrang Kabayo', 'Comedy', 2010, '1h 43m', 'A Filipino comedy full of chaotic situations and humor.', 'assets/images/posters/petrang-kabayo.jpg', 'https://youtu.be/GOFup0heqdA?si=nCKRqxP6ZOzg36Sb', true);
