# 多租户个人空间（@用户名）改造计划

## 摘要

将当前「单作者」Chronicle 改造为「单实例多空间」：所有人在同一个部署（同一 Vercel + 同一 Supabase）注册登录，每个人拥有一个独立空间，空间地址为 `yoursite.com/@用户名`。每个空间拥有自己的文章、分类、昵称头像、空间简介和基础配色（如橙色/蓝色切换）。权限严格隔离：登录者浏览他人主页时无法进入对方的作者后台。

已与用户确认的决策：

1. 模式：单实例多空间（`@用户名` 路径空间）。
2. 个性化范围：内容 + 基础外观（配色预设切换，如橙色/蓝色）。
3. 权限隔离：看别人的主页，不能进入对方后台。
4. 根路径 `/`：全局首页 + 入口（品牌说明 + 登录/注册入口 + 空间列表）。
5. 用户名：注册时必填。

插件（浏览器扩展）无需改动：插件通过 `/api/notes`（Bearer Token）读写速记，速记已按 `author_id` 隔离，Token 已按 `owner_id` 绑定，天然随登录用户隔离。

## 现状分析

### 数据模型（`web/supabase/init.sql`）

- `posts`：已有 `author_id`（references auth.users，默认 auth.uid()），但 `slug text not null unique` 为全局唯一，导致不同用户不能使用相同 slug。
- `categories`：只有 `id / name / parent_id / sort_order / created_at`，**没有 `author_id`**，所有分类全局共享。
- `notes`：已有 `author_id`，RLS 隔离正确。
- `api_tokens` / `pairing_tokens`：已有 `owner_id`，隔离正确。
- `settings`：全局 `key/value`。目前两个键：`site`（站点名/tagline/footer/store URL）和 `user`（display_name/avatar_url）。`user` 键是全局单行，**无法按用户隔离**。
- 无 `profiles` 表：用户名、头像、昵称、简介、主题没有独立归属结构。

### 数据层（`web/lib/data.ts`）

- `getSiteSettings()`：读 `settings.site` + `settings.user`，其中 `author` 取全局 `user.display_name`。
- `getPublicPosts()`：只按 `visibility = public` 过滤，**不按作者过滤**，全局混合。
- `getPublicPostBySlug(slug)`：仅按 slug 全局唯一查询，**无空间/作者维度**。
- `getCategoryWithPosts(categoryId)`：按分类 id 查，但 categories 无用户维度。

### API 路由

- `/api/posts`：GET 在作者态下已按 `author_id` 过滤；POST 已写入 `author_id`。公开列表不走此接口（公开页用服务端数据函数）。
- `/api/posts/[id]`：GET/PATCH/DELETE 已做所有权校验（`author_id !== authorId` → 403），但 slug 查询不带 author_id。
- `/api/categories`：GET/POST **全局**，无 author_id；任何登录用户可读写任何分类。
- `/api/categories/[id]`：PATCH/DELETE 仅按 id，**无归属校验**。
- `/api/settings`：GET/PUT 读写全局 `settings.user`，需改为按当前用户读写 `profiles`。
- `/api/search`：全文搜索公开文章，全局混合，需支持按空间过滤。

### 前端路由（`web/app`）

- 公开页：`/`（首页）、`/posts/[id]`（按 slug）、`/categories`、`/categories/[id]`、`/search`、`/pair`。
- 后台：`/admin/**`。
- 组件 `PostCard` 链接写死 `/posts/${slug}`，需改为空间链接。
- 主题色为 Tailwind 固定色板 `hermes-orange`（主）与 `sky-blue`（次），硬编码在 `tailwind.config.ts` 与各组件中。

### 中间件（`web/middleware.ts`）

- `/admin` 需登录；公开路径含 `/`、`/posts`、`/categories`、`/pair` 及 `/posts/*`、`/categories/*` 正则。缺少 `@用户名` 空间路由的放行。

### 认证（`web/app/auth`）

- `LoginPageClient.tsx`：登录 + 注册（`signUp`），GitHub OAuth（`signInWithOAuth`）。注册表单无用户名字段。
- `auth/callback/route.ts`：OAuth 回调仅 `exchangeCodeForSession` 后重定向，无空间初始化。

## 目标方案

### 1. 数据模型（改动 `web/supabase/init.sql` + 新增迁移文件）

新增 `profiles` 表（用户身份 + 空间元数据 + 主题）：

```sql
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

-- 公开可读（用于空间主页展示）
create policy "profiles select public" on public.profiles
    for select using (true);
-- 仅本人可写
create policy "profiles update self" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles insert self" on public.profiles
    for insert to authenticated with check (auth.uid() = id);
```

`categories` 增加作者归属：

```sql
alter table public.categories add column if not exists author_id uuid
    references auth.users(id) on delete cascade;
-- 回填既有数据（单作者历史数据，取现有 posts 的作者）
update public.categories set author_id =
    (select author_id from public.posts limit 1)
where author_id is null;
alter table public.categories alter column author_id set not null;
alter table public.categories alter column author_id set default auth.uid();

-- 写策略改为仅本人
drop policy if exists "categories write authenticated only" on public.categories;
create policy "categories write authenticated only" on public.categories
    for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
```

`posts.slug` 由全局唯一改为 `(author_id, slug)` 复合唯一：

```sql
alter table public.posts drop constraint if exists posts_slug_key;
create unique index if not exists posts_author_slug_key on public.posts (author_id, slug);
```

新增注册触发器，自动创建 `profiles`：

```sql
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
```

`settings` 表：保留 `site` 键（全局站点品牌 + `chrome_web_store_url`），废弃 `user` 键（昵称/头像迁移到 `profiles`）。删除种子数据中的 `author` 字段引用（保留 name/tagline/footer/store）。

**迁移文件**：新建 `web/supabase/migrations/002_user_spaces.sql`，包含以上 ALTER / CREATE / 回填 / 触发器语句，供已部署实例在 SQL Editor 中执行。新装实例直接使用更新后的 `init.sql`。

### 2. 类型（`web/lib/database.types.ts`）

手动补充 `profiles` 表的 `Row/Insert/Update`，为 `categories` 增加 `author_id`，为 `posts` 增加 `profiles` 关系（可选）。保持与 `createClient<Database>` 一致，否则 `admin.from("profiles")` 会 TS 报错。

### 3. 数据层（`web/lib/data.ts` 重构）

- `getGlobalSiteSettings()`：读 `settings.site`，合并 `DEFAULT_SITE`，用于全局首页（name/tagline/footer）。
- `getProfileByUsername(username)`：`profiles` 按 `username` 查询。
- `getProfileByUserId(userId)`：`profiles` 按 `id` 查询。
- `listSpaces()`：返回拥有至少 1 篇公开文章的 `profiles`（用于全局首页空间列表），并附公开文章数。
- `getSpacePosts(username, { categoryId?, limit? })`：先解析 profile → 查 `posts` 且 `author_id = profile.id` 且 `visibility = public`。
- `getSpacePostBySlug(username, slug)`：profile → `posts` 且 `author_id` + `slug` + `visibility = public`。
- `getSpaceCategories(username)`：`categories` 且 `author_id`。
- `getSpaceCategoryWithPosts(username, categoryId)`：分类 + 该空间该分类公开文章。

原 `getPublicPosts/getPublicPostBySlug/getCategoryWithPosts` 移除或改为空间版本。`PublicPost` 接口保持不变（不再需要全局 author 字段）。

### 4. 用户名工具（`web/lib/utils.ts` 新增）

- `normalizeUsername(input)`：小写、去空格、保留 `[a-z0-9_-]`、截断 30 字符。
- `isValidUsername(input)`：校验 `^[a-z0-9][a-z0-9_-]{2,29}$`（3–30 位）。

### 5. 主题（新增 `web/lib/themes.ts` + `globals.css` + `tailwind.config.ts`）

`lib/themes.ts` 定义预设：

```ts
export type ThemeKey = "orange" | "blue";
export const THEMES: Record<ThemeKey, { label: string; accent: string; accentStrong: string; secondary: string }> = {
  orange: { label: "暖橙", accent: "#ff6b00", accentStrong: "#e05e00", secondary: "#38bdf8" },
  blue:   { label: "海蓝", accent: "#0ea5e0", accentStrong: "#0b85b4", secondary: "#ff6b00" }
};
export const DEFAULT_THEME: ThemeKey = "orange";
```

`globals.css` 增加 CSS 变量与主题覆盖：

```css
:root {
  --accent: 255 107 0;        /* orange 500 */
  --accent-strong: 224 94 0;  /* orange 600 */
  --accent-2: 56 189 248;     /* sky-blue 500 */
}
[data-theme="blue"] {
  --accent: 14 165 224;       /* sky-blue 600 */
  --accent-strong: 11 133 180;
  --accent-2: 255 107 0;      /* orange 500 */
}
```

`tailwind.config.ts` 增加 `accent` 色板（基于变量，支持透明度）：

```ts
accent: {
  DEFAULT: "rgb(var(--accent) / <alpha-value>)",
  strong: "rgb(var(--accent-strong) / <alpha-value>)",
  2: "rgb(var(--accent-2) / <alpha-value>)"
}
```

空间页面的可见强调色（Hero 渐变、主要按钮、链接 hover、分类 chip、blockquote 左边框）改用 `accent`/`accent-2`；正文排版（`prose-minimal` 的 code/blockquote 等）保持品牌默认，避免过度改动。全局首页保持默认橙色品牌风格。

### 6. 认证流程

- `web/app/auth/login/LoginPageClient.tsx`：
  - 注册模式新增「用户名」输入框（必填，`normalizeUsername` + 前端校验）。
  - `signUp` 时 `options.data = { username, display_name: username }`。
- `web/app/auth/callback/route.ts`：OAuth 登录后查询 `profiles`，若 `username` 为自动生成的兜底值（无意义）则重定向 `/auth/username`，否则进入 `next`。
- 新增 `web/app/auth/username/page.tsx`（客户端）：OAuth 用户首次登录补填用户名。
- 新增 `web/app/api/auth/username/route.ts`：POST 校验用户名合法且唯一，更新 `profiles.username`（`resolveAuthorFromRequest` 拿 uid）。

### 7. API 路由改造

- `web/app/api/categories/route.ts`：
  - GET：`resolveAuthorFromRequest` 拿 authorId，`eq("author_id", authorId)` 过滤。
  - POST：写入 `author_id`。
- `web/app/api/categories/[id]/route.ts`：
  - PATCH/DELETE：先查分类的 `author_id`，不等于当前 authorId 返回 403。
- `web/app/api/settings/route.ts`：
  - GET：读 `profiles` 的 `username/display_name/avatar_url/theme` + `auth.user.email` + `has_password`。
  - PUT：写回 `profiles`（display_name/avatar_url/theme），不再用 `settings.user`。
- `web/app/api/search/route.ts`：新增 `username` 参数，解析 profile 后 `eq("author_id", profile.id)`。
- `/api/posts`、`/api/posts/[id]`、`/api/notes`、`/api/pairing/*`：已有 author 隔离，基本不改（仅确保 `/api/posts/[id]` slug 查询改为按 author_id + slug，避免跨用户 slug 冲突）。

### 8. 前端路由与页面

- 根 `/`（`web/app/page.tsx`）重写为全局首页：
  - 品牌 Hero（`HeroCover`，用 `getGlobalSiteSettings` 的 name/tagline）。
  - 「登录 · 注册」入口（指向 `/auth/login?next=/admin`）。
  - 空间列表（`listSpaces()`），每个卡片展示 display_name/username/avatar/bio，链接 `/@用户名`。
  - 页脚。
- 新增 `web/app/@[username]/layout.tsx`（服务端读取 profile，包裹 `data-theme={profile.theme}` 的容器 + 空间头部导航「返回全部空间 / 分类 / 搜索」）。
- 新增 `web/app/@[username]/page.tsx`：空间主页（Hero 用空间 display_name/bio + 该空间公开文章列表，复用 `PostCard`，传 `username`）。
- 新增 `web/app/@[username]/posts/[slug]/page.tsx`：空间文章页（改编自现 `posts/[id]`，署名用 `profile.display_name`，分享/页脚用空间信息）。
- 新增 `web/app/@[username]/categories/page.tsx` 与 `web/app/@[username]/categories/[id]/page.tsx`：空间分类。
- 新增 `web/app/@[username]/search/page.tsx`：空间搜索（`/api/search?username=...`）。
- 删除旧全局公开页：`web/app/posts/[id]/page.tsx`、`web/app/categories/page.tsx`、`web/app/categories/[id]/page.tsx`、`web/app/search/page.tsx`（避免与空间路由语义冲突）。
- `web/components/PostCard.tsx`：新增 `username` 属性，链接改为 `/@${username}/posts/${post.slug}`，强调色改用主题。
- `web/components/HeroCover.tsx`：新增 `accent`/`secondary` 属性，渐变色由主题驱动（保留默认橙色）。

### 9. 中间件（`web/middleware.ts`）

- 公开路径集合新增空间路由：`/@` 前缀放行（`pathname.startsWith("/@")` 直接放行，无需登录）。
- 保持 `/admin` 需登录不变。
- `/api/auth/username` 已包含在现有 `PUBLIC_API_PREFIXES`（`/api/auth`）内，由路由自身做鉴权。

### 10. 权限隔离

- 后台所有数据读取/写入均通过 `resolveAuthorFromRequest` 得到的 `authorId` 过滤（文章、笔记、Token、配对已实现；分类、设置本次补齐）。
- 浏览 `@alice` 的空间页面只走公开数据层（`getSpace*`，仅 `visibility = public`），不触发任何后台写接口，因此无法进入 alice 的 `/admin`；`/admin` 页面自身也只展示当前登录用户数据。
- 私密文章：`getSpacePostBySlug` 仅返回 public，非本人即使猜 slug 也无法看到私密内容。

## 假设与决策

- 全局首页品牌沿用 `DEFAULT_SITE`（Chronicle / 用文字锚定时间），不做全局品牌编辑 UI；`settings.site` 仅保留 `chrome_web_store_url` 作为共享全局设置（插件安装页可编辑）。
- 主题预设首期仅实现 `orange`（默认）与 `blue` 两套，`THEMES` 结构预留扩展（后续可加 green/rose）。
- 空间列表只展示「至少发布过 1 篇公开文章」的空间，避免空号刷屏。
- 用户名规则：`^[a-z0-9][a-z0-9_-]{2,29}$`，小写，唯一；与现有 slug 生成无冲突。
- OAuth（GitHub）用户：注册时无用户名，触发器生成兜底 `u<10位>`，首次登录强制补填用户名后才进入后台。
- 邮件确认流程不变：注册后仍需点邮箱确认链接；触发器在 `auth.users` 插入时即建 profile（含 username 元数据）。

## 实施步骤

1. 更新 `web/supabase/init.sql`（profiles、categories.author_id、posts 复合唯一、触发器、settings 种子、RLS）。
2. 新建 `web/supabase/migrations/002_user_spaces.sql`（含回填与 ALTER）。
3. 更新 `web/lib/database.types.ts`（profiles、categories.author_id）。
4. 更新 `web/lib/utils.ts`（normalizeUsername / isValidUsername）。
5. 新建 `web/lib/themes.ts`。
6. 更新 `web/tailwind.config.ts`（accent 色板）与 `web/styles/globals.css`（主题变量 + data-theme）。
7. 重构 `web/lib/data.ts`（getGlobalSiteSettings / getProfile* / listSpaces / getSpace*）。
8. 改造 `/api/categories`、`/api/categories/[id]`、`/api/settings`、`/api/search`、`/api/posts/[id]`。
9. 改造认证：`LoginPageClient.tsx`、`auth/callback/route.ts`，新增 `auth/username/page.tsx`、`api/auth/username/route.ts`。
10. 改造 `middleware.ts`（放行 `/@`）。
11. 重写 `/` 全局首页；新增 `@[username]` 空间页面（layout、主页、文章、分类、搜索）。
12. 删除旧全局公开页；更新 `PostCard`、`HeroCover` 支持空间链接与主题。
13. 更新后台设置页 `web/app/admin/settings/page.tsx` 增加「配色主题」选择器（读写 `profiles.theme`），昵称/头像读写改走新 `/api/settings`。

## 验证

- `npm run lint`（如存在）与 `npx tsc --noEmit` 通过（在 `web` 目录）。
- `npm run build`（Next 构建）通过。
- 在 Supabase SQL Editor 执行 `init.sql`（新装）或 `migrations/002_user_spaces.sql`（既有）。
- 手动验证：
  - 注册两个账号（A、B），各自设置不同主题。
  - `/@a`、`/@b` 各自只展示自己的公开文章与分类。
  - A 登录后访问 `/@b` 只能阅读，无法进入 `/admin` 看到 B 的数据。
  - A 在后台创建的分类/文章，B 后台不可见，公开页互不串。
  - 私密文章仅本人可见。
  - 主题切换（橙/蓝）在空间主页生效。
  - 插件速记：A、B 各自的 Token 只能读写自己的速记。

## 推送

实现并验证通过后：提交改动、打 tag（`v0.5.0`）、推送到远端。
