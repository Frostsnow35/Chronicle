-- =====================================================================
-- 迁移 002：多租户个人空间（@用户名）
-- 在已部署实例的 Supabase SQL Editor 中一次性粘贴运行。
-- 幂等：可重复执行，已存在的对象/列会跳过。
-- =====================================================================

-- 1. 新增用户空间表 profiles
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique,
    display_name text not null default '',
    avatar_url text,
    bio text not null default '',
    theme text not null default 'orange',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles select public" on public.profiles;
create policy "profiles select public" on public.profiles
    for select using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
    for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_update_trigger on public.profiles;
create trigger profiles_update_trigger
before update on public.profiles
for each row execute function public.trigger_set_updated_at();

-- 2. categories 增加 author_id 并回填历史数据
alter table public.categories add column if not exists author_id uuid
    references auth.users(id) on delete cascade;

update public.categories set author_id =
    (select author_id from public.posts order by created_at asc limit 1)
where author_id is null;

alter table public.categories alter column author_id set not null;
alter table public.categories alter column author_id set default auth.uid();

drop policy if exists "categories write authenticated only" on public.categories;
create policy "categories write authenticated only" on public.categories
    for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- 3. posts.slug 由全局唯一改为 (author_id, slug) 复合唯一
alter table public.posts drop constraint if exists posts_slug_key;
create unique index if not exists posts_author_slug_key on public.posts (author_id, slug);

-- 4. 新用户注册自动创建 profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, display_name, avatar_url)
    values (
        new.id,
        coalesce(
            lower(regexp_replace(new.raw_user_meta_data->>'username', '[^a-z0-9_-]', '', 'g')),
            'u' || substr(md5(new.id::text), 1, 10)
        ),
        coalesce(new.raw_user_meta_data->>'display_name', ''),
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 5. 为既有用户补建 profiles（历史用户）
insert into public.profiles (id, username, display_name, avatar_url)
select
    u.id,
    coalesce(
        lower(regexp_replace(u.raw_user_meta_data->>'username', '[^a-z0-9_-]', '', 'g')),
        'u' || substr(md5(u.id::text), 1, 10)
    ),
    coalesce(u.raw_user_meta_data->>'display_name', ''),
    u.raw_user_meta_data->>'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- 6. 清理旧的全局 user 设置（昵称/头像已迁移至 profiles）
delete from public.settings where key = 'user';
