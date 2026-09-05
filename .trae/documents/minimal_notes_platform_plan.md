# 极简文字记录平台 实施计划

## 项目概述
构建「Web 个人文字站点 + Chromium 浏览器速记插件」的独立部署系统。每个用户使用自己的 Vercel + Supabase 免费额度部署私有站点与数据库，拥有独立域名。作者通过站点后台撰写文章（单篇可选公开/私密），访客浏览公开文章并分享；浏览器插件通过一键短链接配对或手动配置连接用户私有站点，在弹窗内快速记录笔记并保存至同一数据库。

设计基调：首屏整屏爱马仕橙 + 天蓝模糊渐变封面（缓慢流动动效），全站低饱和淡渐变背景贯穿；主体功能区采用黑白灰 + 强调色的居中窄幅大量留白布局；衬线体主导排版；内容卡片玻璃拟态（毛玻璃半透明）质感。

---

## 一、技术栈选型（全免费开源方案）

### 1.1 Web 站点（全栈）
- **框架**：Next.js 14 App Router（React 18 + TypeScript），Server Components + API Routes
  - 免费、社区庞大、Vercel 原生支持、SSR/SSG/ISR 灵活
- **UI 样式**：Tailwind CSS 3 + CSS Variables（主题色系统）
  - 免费、原子化、适配玻璃拟态与渐变效果成本低
- **富文本编辑器**：Tiptap（基于 ProseMirror）
  - 免费开源、轻量、支持自定义扩展（标题/粗体/斜体/列表/引用/图片）
- **图片上传存储**：Supabase Storage（用户自备免费额度）
  - 与数据库同服务，免额外配置，内置 CDN
- **鉴权方案**：Supabase Auth（支持邮箱密码 + GitHub/Google OAuth）
  - 免费额度、内置邮件模板、OAuth 配置向导完善
- **数据库**：Supabase PostgreSQL（用户自备免费额度：500MB 存储、5GB 带宽/月）
  - 免费额度充足、自动备份、与 Next.js 生态无缝集成

### 1.2 浏览器插件（Chromium Manifest V3）
- **构建工具**：Vite + @crxjs/vite-plugin
  - 免费、HMR 开发体验好、原生支持 MV3
- **框架**：React 18 + TypeScript + Tailwind CSS（与站点共享 UI Token）
- **编辑器**：Tiptap 轻量精简版（文字 + 图片）
- **存储**：chrome.storage.local（暂存草稿 + 保存用户域名/Token 配置）
- **通讯**：fetch 调用站点 REST API（JSON 请求头 + Bearer Token）

### 1.3 部署与 CI/CD
- **站点部署**：Vercel Hobby 免费层（用户自备：100GB 带宽/月、无限 Serverless Function 调用）
  - 提供「Deploy to Vercel」按钮，用户点击即 Fork 仓库并部署，无需 Git 命令行
- **数据库部署**：Supabase Free 层（用户自备），提供「创建 Supabase 项目 → 运行 SQL 初始化脚本」图文指引
- **插件发布**：提供本地加载开发者模式插件的指引；可选 Chrome Web Store 上架教程（开发者账号 $5 一次性费用，用户自费）

---

## 二、系统分层架构图（Mermaid）

```mermaid
graph TD
    subgraph 用户设备
        A[Chromium 浏览器插件 MV3<br/>弹窗编辑器 | 草稿缓存 | 配对配置]
    end
    subgraph 用户私有部署 Vercel
        B[Next.js 14 Web 站点<br/>App Router + API Routes]
        C[访客前端<br/>首页封面 + 公开文章列表 + 文章详情 + 分享]
        D[作者后台<br/>登录/注册 + 文章 CRUD + 分类管理 + 插件配对 + 个人设置]
        E[REST API 层<br/>/api/posts /api/categories /api/notes /api/auth /api/pairing]
        F[鉴权中间件<br/>Supabase Auth Session + API Token 校验]
    end
    subgraph 用户私有 Supabase 项目
        G[(PostgreSQL 数据库<br/>posts / categories / notes / pairing_tokens / settings)]
        H[Supabase Auth<br/>邮箱密码 + GitHub/Google OAuth]
        I[Supabase Storage<br/>文章插图 / 笔记图片 Bucket]
    end

    A -->|HTTPS + Bearer Token| E
    E --> F
    F --> H
    E --> G
    C --> E
    D --> E
    D -->|图片上传| I
    A -->|图片上传| I
```

模块接口契约（核心）：
- `POST /api/auth/login`：邮箱密码登录，返回 Session Cookie
- `POST /api/auth/oauth/:provider`：GitHub/Google OAuth 跳转
- `GET /api/posts?visibility=public&category_id=&page=1`：公开文章列表（访客可调用）
- `GET /api/posts/:id`：单篇文章（私密需作者 Session）
- `POST /api/posts` `PATCH /api/posts/:id` `DELETE /api/posts/:id`：文章 CRUD（需作者 Session）
- `GET /api/categories` `POST /api/categories`：分类 CRUD
- `POST /api/pairing/generate`：生成一次性配对短链接（需作者 Session，有效期 1 小时）
- `POST /api/pairing/exchange`：配对链接换长期 API Token（插件调用）
- `POST /api/notes` `GET /api/notes`：插件速记笔记 CRUD（需 Bearer Token）
- `POST /api/storage/upload`：统一图片上传接口（返回公开访问 URL）

---

## 三、文件与模块规划

```
e:\新建文件夹\
├── web/                              Next.js Web 站点根目录
│   ├── app/                          App Router 页面
│   │   ├── layout.tsx                全局布局：字体加载、主题 Token、渐变背景、流动动效
│   │   ├── page.tsx                  访客首页：首屏整屏渐变封面 + 滚动后文章列表（玻璃拟态卡片、居中窄幅）
│   │   ├── posts/[id]/page.tsx       文章详情页：衬线正文居中、分享按钮、公开/私密校验
│   │   ├── categories/[id]/page.tsx  分类视图页
│   │   ├── auth/                     作者登录注册页（邮箱密码 + GitHub/Google OAuth 入口）
│   │   ├── admin/                    作者后台（需 Session 中间件保护）
│   │   │   ├── layout.tsx            后台导航栏（文章/分类/插件配对/设置）
│   │   │   ├── page.tsx              文章列表（时间线 / 分类树切换视图）
│   │   │   ├── editor/[id?]/page.tsx Tiptap 轻量富文本编辑器、标题栏、公开/私密切换、分类下拉、发布按钮
│   │   │   ├── categories/page.tsx   分类树管理（新增/重命名/删除/排序）
│   │   │   ├── pairing/page.tsx      生成配对短链接界面（一键复制 + 有效期说明）+ 手动 Token 管理
│   │   │   └── settings/page.tsx     站点名/简介/作者信息/OAuth 配置说明
│   │   └── api/                      所有 API Routes（见上方接口契约）
│   ├── components/
│   │   ├── ui/                       基础组件：玻璃卡片、渐变按钮、衬线标题、无衬线正文、分割线、毛玻璃顶栏
│   │   ├── GradientBackground.tsx    全站低饱和橙蓝淡渐变背景 + 缓慢流动动效（CSS animation）
│   │   ├── HeroCover.tsx             首页整屏渐变封面 + 模糊效果（backdrop-filter）
│   │   ├── PostCard.tsx              玻璃拟态文章卡片（标题、摘要、日期、分类标签）
│   │   ├── ShareButtons.tsx          社交平台分享（微博/Twitter/复制链接）
│   │   ├── Editor/TiptapEditor.tsx   封装 Tiptap（扩展：标题/粗体/斜体/有序无序列表/引用/图片）
│   │   └── CategoryTree.tsx          可折叠分类树组件
│   ├── lib/
│   │   ├── supabase/                 Server/Client 两种 Supabase 客户端初始化
│   │   ├── auth-middleware.ts        Next.js middleware，保护 /admin/** 与 /api/** 中需鉴权路由
│   │   ├── pairing.ts                配对短链接生成 / Token 交换逻辑（JWT 或随机 Token 入库）
│   │   └── utils.ts                  日期格式化、分类树构建、slug 生成
│   ├── styles/
│   │   └── globals.css               Tailwind 指令、CSS Variables（橙/蓝/灰阶 Token）、衬线字体 @font-face
│   ├── supabase/
│   │   └── init.sql                  数据库初始化脚本（建表 + RLS 行级安全策略）
│   ├── public/                       静态资源：favicon、OG Image、部署说明插图
│   ├── .env.example                  环境变量模板（SUPABASE_URL / SUPABASE_ANON_KEY / SITE_URL 等）
│   ├── next.config.js                图片域名白名单（Supabase Storage）
│   ├── tailwind.config.ts            主题色扩展（hermes-orange / sky-blue / neutral 灰阶）+ 衬线字体 sans/serif 配置
│   ├── tsconfig.json                 严格模式
│   └── package.json
│
├── extension/                        Chromium 浏览器插件根目录
│   ├── manifest.config.ts            MV3 manifest：权限（storage / activeTab / scripting）、popup / options_page
│   ├── src/
│   │   ├── popup/                    弹窗主页面（点击插件图标打开）
│   │   │   ├── PopupApp.tsx          弹窗入口：未配置显示向导，已配置显示速记编辑器
│   │   │   ├── QuickEditor.tsx       精简 Tiptap（文字 + 图片）+ 保存按钮 + 草稿自动保存
│   │   │   └── SavedToast.tsx        保存成功提示（含「在站点中查看」链接）
│   │   ├── options/                  插件配置页（也作为首次向导）
│   │   │   ├── OptionsApp.tsx        Tab 切换：一键配对 / 手动配置
│   │   │   ├── PairWizard.tsx        一键配对流程：粘贴配对短链接 → 校验 → 交换 Token → 保存
│   │   │   └── ManualConfig.tsx      手动输入域名 + API Token → 测试连接 → 保存
│   │   ├── background/
│   │   │   └── service-worker.ts     MV3 Service Worker：Token 刷新、草稿同步失败重试
│   │   └── lib/
│   │       ├── api-client.ts         站点 API 封装（从 storage 读域名/Token，自动带 Authorization）
│   │       ├── storage.ts            chrome.storage.local 封装：域名、Token、草稿、配置状态
│   │       └── editor-extensions.ts  插件版 Tiptap 扩展集合（精简版）
│   ├── vite.config.ts                @crxjs/vite-plugin 配置
│   ├── tailwind.config.ts            与 Web 共享同一套颜色/字体 Token
│   └── package.json
│
├── docs/                             部署与使用文档（用户必读）
│   ├── 01-deploy-to-vercel-supabase.md   分步图文：注册 Supabase → 建项目 → 复制 init.sql → 注册 Vercel → Deploy 按钮 → 环境变量 → 首次登录
│   ├── 02-configure-oauth.md         GitHub OAuth App 与 Google Cloud OAuth 凭据创建步骤（带截图指引）
│   ├── 03-install-extension.md       本地加载开发者模式插件步骤 + Chrome/Edge 分别指引
│   ├── 04-pair-extension.md          生成配对短链接 → 插件内粘贴配对的完整流程
│   └── 05-faq-troubleshooting.md     常见问题：Vercel 部署失败、Supabase RLS 报错、插件 401 未授权等
│
├── vercel.json                       Vercel 全局配置（可选）
├── README.md                         项目首页：特性简介、架构图、快速开始链接到 docs/01
└── .gitignore                        Node / Next / 构建产物
```

---

## 四、实施步骤（按依赖顺序）

### 阶段 1：项目骨架与设计系统（基础搭建）
1. 初始化 `web/` Next.js 14 + TypeScript 项目，配置 Tailwind 3，安装 Tiptap 核心包与扩展，安装 Supabase SDK
2. 初始化 `extension/` Vite + React + @crxjs/vite-plugin 项目，配置 Tailwind 共享 Web 色值 Token
3. 建立设计令牌系统：`tailwind.config.ts` 中定义 `colors.hermes-orange: '#FF6B00'`、`colors.sky-blue: '#38BDF8'`、11 级灰阶；`extend.fontFamily.serif` 配置思源宋体 / Noto Serif SC + Inter 英文无衬线组合
4. 编写 `globals.css`：CSS Variables 映射、`@import` 思源宋体 Google Fonts（或自托管）、正文衬线规则；定义 `.glass-card`（backdrop-blur + bg-white/70 + border-white/20 + shadow-sm）`.glass-nav`（毛玻璃顶栏）通用类
5. 编写 `GradientBackground.tsx`：两层径向渐变（橙从左上、蓝从右下）叠在 `<body>` 伪元素上，`@keyframes float-gradient` 缓慢位移 + 色相微变；`HeroCover.tsx`：整屏 h-screen 模糊渐变 + 中央玻璃卡片（站点名、副标题、CTA 按钮）
6. 编写基础 UI 组件（`Button`、`GlassCard`、`SerifHeading`、`MetaText`）在 `web/components/ui/`，全部走玻璃拟态风格

### 阶段 2：Supabase 数据库与鉴权基础设施
7. 编写 `web/supabase/init.sql`：创建表结构
   - `categories(id, name, parent_id, sort_order, created_at)`
   - `posts(id, title, slug, content_json, content_html, excerpt, cover_image, visibility enum('public','private'), category_id, author_id, created_at, updated_at)`
   - `notes(id, content_json, content_html, images[], created_at, updated_at)` — 插件速记笔记
   - `api_tokens(id, token_hash, name, created_at, last_used_at, expires_at)` — 插件长期 Token
   - `pairing_tokens(token, expires_at, consumed)` — 一次性短链接配对
   - `settings(key, value)` — 站点配置
   - 对所有表启用 RLS（行级安全）：作者 Session 可全读写，访客仅对 `visibility='public'` 的 posts 与公开 categories 有 select
8. 实现 `lib/supabase/server.ts` 和 `lib/supabase/client.ts`：Server/Client Supabase 客户端工厂，从环境变量读 URL / ANON_KEY / SERVICE_ROLE_KEY
9. 实现 `middleware.ts`：对 `/admin/**` 路由检查 Supabase Session，无则 302 到 `/auth/login`；对 `/api/**` 按接口名单区分公开/需鉴权
10. 实现作者鉴权页面：`app/auth/login/page.tsx`（邮箱密码表单 + GitHub/Google 按钮）、`app/auth/callback/route.ts`（OAuth 回调）；Supabase Auth 邮件模板在文档中说明如何自定义

### 阶段 3：Web 作者后台核心（文章 + 分类 + 配对）
11. 后台总布局 `app/admin/layout.tsx`：左侧窄边导航（文章/分类/配对/设置）+ 主内容区玻璃容器；`app/admin/page.tsx` 文章列表：顶部「时间线 / 分类树」切换 Tab，时间线按月份分组倒序，分类树展示层级并可点击筛选
12. 分类管理 `app/admin/categories/page.tsx`：使用 `CategoryTree.tsx` 组件，支持新增同级/子分类、拖拽排序（dnd-kit，免费）、重命名、删除（无子分类时才允许）
13. 编辑器 `app/admin/editor/[id?]/page.tsx`：封装 `TiptapEditor.tsx` 加载扩展（StarterKit 标题/粗体/斜体/列表/引用 + Image 扩展 + 图片上传调用 `/api/storage/upload` 返回 URL 插入）；顶部栏：文章标题输入、分类下拉、Public/Private 开关、发布/保存草稿按钮；`content` 同时存 JSON（供回编）与 HTML（供展示）
14. 文章 CRUD API：`app/api/posts/route.ts`、`app/api/posts/[id]/route.ts`，分类 CRUD API：`app/api/categories/route.ts`；所有接口走 Service Role 绕过 RLS + 手动校验作者身份
15. 配对生成页面 `app/admin/pairing/page.tsx`：「生成配对链接」按钮调 `POST /api/pairing/generate`，返回形如 `https://{site}/pair?token=xxxxxxx` 的短链接，展示一键复制 + 60 分钟有效期倒计时；下方「手动管理 API Token」列表（新增、吊销、显示一次性）；实现 `pairing.ts` 工具：JWT 或随机字符串入库，过期自动清理
16. 站点设置页 `app/admin/settings/page.tsx`：编辑站点名称、一句话副标题、作者署名、SEO 默认 OG 图；保存到 `settings` 表

### 阶段 4：Web 访客前端（首页 + 详情 + 分享）
17. 首页 `app/page.tsx`：首屏 HeroCover + 渐变背景；滚动进入文章列表区，居中 max-w-[768px]，`PostCard.tsx` 玻璃卡片阵列（日期、分类标签、标题衬线、摘要）；底部分页（每页 10 条）
18. 文章详情 `app/posts/[id]/page.tsx`：中间 Server Component 校验 visibility（私有直接 404）；居中 max-w-[720px]，标题超大衬线、日期/分类元信息、正文渲染 `content_html`（自定义排版样式：p 行高 1.9、标题间距、blockquote 左侧竖线 + 背景色）；文末 `ShareButtons.tsx`：复制当前 URL（clipboard API）、Twitter/X Intent、微博分享 Intent
19. 分类视图 `app/categories/[id]/page.tsx`：分类名下一行说明，下方同首页文章列表过滤

### 阶段 5：浏览器插件开发
20. 配置 `extension/manifest.config.ts`：MV3 manifest_version 3，name/icon/version，`action.default_popup: "src/popup/index.html"`，`options_page: "src/options/index.html"`，permissions: `["storage"]`，host_permissions: `["<all_urls>"]`（调用用户任意域名的 API）
21. 首次打开插件的配置向导：`popup/PopupApp.tsx` 检查 `chrome.storage.local` 是否存 `siteUrl + apiToken`，否则显示「请先配置插件」提示 + 跳转到 Options 页按钮
22. Options 页「一键配对」Tab：`PairWizard.tsx` 粘贴配对短链接输入框 → 调 `POST {短链接所在域}/api/pairing/exchange` → 返回长期 apiToken → 保存 `{siteUrl, apiToken}` → 提示成功并测试连接；「手动配置」Tab：`ManualConfig.tsx` 域名 + Token 两栏 + 「测试连接」按钮（调用 GET /api/notes 空参数）→ 保存
23. 速记编辑器 `QuickEditor.tsx`：精简版 Tiptap（仅 Paragraph + Bold + Italic + BulletList + Image）；顶部工具栏 4 个按钮 + 图片上传（同一 `/api/storage/upload`）；保存按钮调 `POST {siteUrl}/api/notes`；草稿每 3 秒自动保存到 `chrome.storage.local`，下次打开自动填充，保存成功后清空草稿
24. Service Worker `background/service-worker.ts`：监听草稿失败重试队列，每 5 分钟尝试重发失败的笔记；Token 失效（401）时向 popup 发消息提示重新配对

### 阶段 6：部署文档与交付
25. 编写 `docs/01-deploy-to-vercel-supabase.md`：逐步截图级指引
   - 注册 Supabase → New Project → 选择区域 → 复制 SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
   - SQL Editor → 粘贴 init.sql → Run
   - Storage → 新建 public bucket `uploads` → Policy 允许 authenticated 上传、public 读取
   - 登录 GitHub → Fork 本项目 → 在 `README.md` 添加 Deploy to Vercel 按钮（`https://vercel.com/new/git-urls?repository-url=...&env=SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL`）
   - 点击 Deploy → 填环境变量 → 等待部署 → 分配域名
   - 访问 `{域名}/auth/login` → 注册作者账号 → 进入后台 → 完成设置页
26. 编写 `docs/02-configure-oauth.md`：GitHub OAuth App 创建（Application name / Homepage URL / Authorization callback URL 填 `{域名}/auth/callback`）→ 复制 Client ID / Secret 到 Supabase Auth → Providers → GitHub；Google Cloud Console 类似流程
27. 编写 `docs/03-install-extension.md`：Chrome → chrome://extensions → 开启开发者模式 → 加载已解压的扩展程序 → 选择 `extension/dist/` 文件夹；Edge 同 `edge://extensions`
28. 编写 `docs/04-pair-extension.md`：站点后台 → 插件配对 → 生成 → 复制 → 插件 Options → 一键配对 → 粘贴 → 完成
29. 编写 `docs/05-faq-troubleshooting.md`：Vercel 构建失败排查日志、Supabase RLS 403 检查 Policy、插件 CORS 错误确认域名白名单、Token 401 请重新配对、Supabase 免费额度接近上限的提示
30. 编写 `README.md`：项目简介 + 特性清单 + 架构图缩略 + 快速开始三步骤链接 + 「给作者一杯咖啡」可选

### 阶段 7：联调与验证
31. 本地启动 `web/`：`npm run dev` → Supabase 本地环境用 `init.sql` 建表 → 完整走通注册→登录→写文章→公开→访客浏览→分享复制；私密文章访客 404；分类增删改；生成配对链接
32. 本地构建 `extension/`：`npm run build` → Chrome 加载 dist → 完整走通手动配置、一键配对、快速打字、插图片、保存到站点、站点后台「笔记」Tab（若需要新增页面展示笔记则补充，否则默认 notes 表仅作为数据保留用于未来扩展）
33. CORS 验证：插件跨域名访问自部署站点的 API，Next.js 在 `next.config.js` 或 API Routes 中返回 `Access-Control-Allow-Origin: *` 或白名单校验

---

## 五、依赖与注意事项
- **Supabase RLS 是强制安全底线**：所有表必须启用 RLS，Post/Note 的 select 策略中检查 `visibility='public'` 或 `author_id = auth.uid()`，杜绝越权访问私密文章。
- **图片上传走 Supabase Storage signed URL 而非 Service Role 直接上传**：API `/api/storage/upload` 在服务端生成 1 小时有效的 upload signed URL，前端/插件拿到后直传，避免 SERVICE_ROLE_KEY 暴露到客户端。
- **浏览器插件 MV3 Service Worker 生命周期**：它会被浏览器随时休眠，长任务（如大图片上传）放在 popup 前台上下文；失败重试队列用 chrome.storage.alarms 定时触发。
- **Deploy to Vercel 按钮必须让用户 Fork 自己的仓库**：避免用户的后续自定义修改污染上游；README 中同时提供「手动 git clone → Vercel New Project → Import」路径。
- **Supabase 免费额度用完的降级方案**：文档中提示用户 500MB 存储空间接近上限时，可升级到 Pro 或自行导出数据迁移；架构不绑定 Supabase，用户可切换到任意 PostgreSQL + S3 兼容存储。
- **字体版权**：思源宋体（Source Han Serif SC / Noto Serif SC）是 SIL OFL 开源协议，免费商用，放心自托管或 Google Fonts 引入。
- **配色对比度**：爱马仕橙 `#FF6B00` 在白底上的 WCAG 对比度 ≈ 3:1，仅适合强调色/按钮，**正文文字必须用灰阶 #1f2937 以上**，确保 AA 级 4.5:1 可访问性。

---

## 六、验证清单
1. **构建通过**：`cd web && npm run build` 无错误；`cd extension && npm run build` 生成 dist 文件夹无错误。
2. **TypeScript 严格模式零报错**：`cd web && npx tsc --noEmit` 无错误；插件同。
3. **访客权限**：未登录状态访问 `/admin/*` 跳转登录；直接 GET `/api/posts` 仅返回 visibility='public'；URL 直接访问私密文章 `/posts/<id>` 返回 404。
4. **插件闭环**：生成配对链接 → 插件粘贴配对 → 插件速记输入文字+图片 → 点击保存 → Supabase `notes` 表出现新行 → `images[]` 字段 URL 可在浏览器打开。
5. **分享按钮**：复制链接按钮剪贴板内容与地址栏一致；Twitter/微博 Intent URL 正确拼接当前标题与 URL。
6. **部署文档可读性**：找一台全新机器按 `docs/01` 从零操作，不依赖任何其他文档，30 分钟内完成一个可用站点部署。
7. **响应式**：视口 375px（手机）、768px（平板）、1440px（桌面）三档下，居中窄幅区不溢出，玻璃卡片和渐变背景自适应正常。

---

## 七、风险与处理
| 风险 | 影响 | 处理方案 |
|---|---|---|
| Supabase 免费层项目因 7 天不活跃被暂停 | 用户站点短暂不可用 | 文档显著提醒：每月至少登录一次 Supabase Dashboard 或调用一次 API，或升级 Pro（$25/月）；同时提供数据导出指南 |
| Vercel Hobby 层 100GB 带宽提前用完 | 月末访客打不开站点 | 文档提示流量大的用户可绑定自己的域名通过 Cloudflare 免费 CDN 缓存静态资源；或升级 Vercel Pro |
| Chrome Web Store 2024+ MV3 审核规则变动 | 插件上架被拒 | 提供两种分发方式：优先本地加载开发者模式（零审核、零成本）；上架文档标记为「可选高级操作」，用户自担审核风险 |
| Tiptap 编辑器在插件 popup 小窗口中工具栏拥挤 | 速记体验差 | popup 宽度固定 480px、高度 560px；工具栏只留 Bold / Italic / List / Image 四图标，hover 才显示 tooltip |
| 玻璃拟态 backdrop-filter 在低性能设备上掉帧 | 阅读体验卡顿 | CSS 中使用 `@media (prefers-reduced-motion: reduce)` 关闭渐变流动动效；`backdrop-filter` 用 `blur(8px)` 而非 16px，降低 GPU 负担 |
| 用户把配对短链接外泄导致他人绑定插件 | 未授权插件写入用户数据库 | 配对 Token 单次使用 + 60 分钟强制过期；交换成功后立即标记 consumed；Token 交换接口加 5 次/分钟限流 |
