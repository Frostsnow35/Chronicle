-- =====================================================================
-- 极简笔记 · 数据库初始化脚本
-- 在 Supabase SQL Editor 中一次性粘贴运行。
-- 所有表均启用 RLS（行级安全），防止越权访问。
-- =====================================================================

-- 扩展
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. 分类 categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    parent_id uuid references public.categories(id) on delete set null,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories select public" on public.categories;
create policy "categories select public" on public.categories
    for select using (true);

drop policy if exists "categories write authenticated only" on public.categories;
create policy "categories write authenticated only" on public.categories
    for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 2. 文章 posts
-- ---------------------------------------------------------------------
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    content_json jsonb not null default '{}'::jsonb,
    content_html text not null default '',
    excerpt text not null default '',
    cover_image text,
    visibility text not null default 'public' check (visibility in ('public', 'private')),
    category_id uuid references public.categories(id) on delete set null,
    author_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists posts_visibility_created_at_idx on public.posts (visibility desc, created_at desc);
create index if not exists posts_category_idx on public.posts (category_id);

alter table public.posts enable row level security;

-- 任何人都可以 SELECT 公开文章
drop policy if exists "posts select public visibility" on public.posts;
create policy "posts select public visibility" on public.posts
    for select using (visibility = 'public');

-- 作者本人可以 SELECT 自己的全部文章
drop policy if exists "posts select self" on public.posts;
create policy "posts select self" on public.posts
    for select to authenticated using (auth.uid() = author_id);

-- 作者本人可以 INSERT/UPDATE/DELETE 自己的文章
drop policy if exists "posts insert self" on public.posts;
create policy "posts insert self" on public.posts
    for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "posts update self" on public.posts;
create policy "posts update self" on public.posts
    for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "posts delete self" on public.posts;
create policy "posts delete self" on public.posts
    for delete to authenticated using (auth.uid() = author_id);

-- updated_at 自动维护触发器
create or replace function public.trigger_set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql volatile;

drop trigger if exists posts_update_trigger on public.posts;
create trigger posts_update_trigger
before update on public.posts
for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------
-- 3. 插件速记笔记 notes
-- ---------------------------------------------------------------------
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    content_json jsonb not null default '{}'::jsonb,
    content_html text not null default '',
    source_url text,
    images text[] not null default array[]::text[],
    author_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists notes_author_created_idx on public.notes (author_id, created_at desc);

alter table public.notes enable row level security;

-- notes 永远只有作者自己可读可写（浏览器插件通过 Service Role API 手动校验 token，不走 RLS）
drop policy if exists "notes owner" on public.notes;
create policy "notes owner" on public.notes
    for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop trigger if exists notes_update_trigger on public.notes;
create trigger notes_update_trigger
before update on public.notes
for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------
-- 4. 插件长期 API Token api_tokens
--    密码学哈希存储，和 HTTP "Authorization: Bearer ..." 对应。
-- ---------------------------------------------------------------------
create table if not exists public.api_tokens (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null unique,
    name text,
    owner_id uuid references auth.users(id) on delete cascade not null,
    last_used_at timestamptz,
    created_at timestamptz not null default now(),
    expires_at timestamptz
);

create index if not exists api_tokens_owner_idx on public.api_tokens (owner_id);

alter table public.api_tokens enable row level security;

drop policy if exists "api_tokens self" on public.api_tokens;
create policy "api_tokens self" on public.api_tokens
    for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- 5. 一次性配对链接 pairing_tokens
--    插件「一键短链接配对」使用
-- ---------------------------------------------------------------------
create table if not exists public.pairing_tokens (
    token text primary key,
    owner_id uuid references auth.users(id) on delete cascade not null,
    expires_at timestamptz not null default (now() + interval '1 hour'),
    consumed boolean not null default false,
    created_at timestamptz not null default now(),
    consumed_at timestamptz
);

alter table public.pairing_tokens enable row level security;

drop policy if exists "pairing self" on public.pairing_tokens;
create policy "pairing self" on public.pairing_tokens
    for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- 6. 站点设置 settings（key/value）
-- ---------------------------------------------------------------------
create table if not exists public.settings (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings select public" on public.settings;
create policy "settings select public" on public.settings
    for select using (true);

drop policy if exists "settings write authenticated" on public.settings;
create policy "settings write authenticated" on public.settings
    for all to authenticated using (true) with check (true);

drop trigger if exists settings_update_trigger on public.settings;
create trigger settings_update_trigger
before update on public.settings
for each row execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------
-- 7. Supabase Storage：自动创建 uploads 公开 bucket 及其访问策略
--    public = true：图片通过公开 URL 展示（无需登录即可读取）
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads authenticated upload" on storage.objects;
create policy "uploads authenticated upload" on storage.objects
    for insert to authenticated with check (bucket_id = 'uploads');

drop policy if exists "uploads public read" on storage.objects;
create policy "uploads public read" on storage.objects
    for select using (bucket_id = 'uploads');

drop policy if exists "uploads owner delete" on storage.objects;
create policy "uploads owner delete" on storage.objects
    for delete to authenticated using (bucket_id = 'uploads');

-- ---------------------------------------------------------------------
-- 8. 种子数据：一条默认站点名设置
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
    ('site', jsonb_build_object(
        'name', 'Chronicle',
        'tagline', '用文字锚定时间',
        'author', '霜雪',
        'footer_text', '为流动的日子留下凭据',
        'chrome_web_store_url', ''
    ))
on conflict (key) do nothing;
