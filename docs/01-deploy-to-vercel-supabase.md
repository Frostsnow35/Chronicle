# 01 · 部署你的站点（Vercel + Supabase）

本指南教你用自己的 Vercel 与 Supabase 免费额度，部署一个完全属于你自己的极简文字站点。全程使用你自己的账号和资源，无需连接开发者的任何服务。

整个过程分六步：建数据库 → 跑初始化脚本 → 确认图片存储 → 获取密钥 → 一键部署 → 首次登录。

---

## 第一步：创建 Supabase 数据库

1. 打开 [https://supabase.com](https://supabase.com)，点击右上角 **Sign in**。
2. 建议用 GitHub 账号登录（之后会更顺畅），也可用邮箱注册。
3. 登录后进入 Dashboard，点击 **New project**。
4. 填写：
   - **Name**：随便填，例如 `my-notes`
   - **Database Password**：设置一个强密码，请务必记下来（后面不会直接用到，但别忘）
   - **Region**：选择离你最近的区域（国内用户可选 `Southeast Asia (Singapore)`）
5. 点击 **Create new project**，等待 1~2 分钟初始化完成。

---

## 第二步：运行数据库初始化脚本

1. 项目创建完成后，在左侧菜单点击 **SQL Editor**。
2. 点击 **New query**，新建一个查询窗口。
3. 打开本仓库的 [`web/supabase/init.sql`](../web/supabase/init.sql)，把**全部内容**复制粘贴到查询窗口。
4. 点击右下角 **Run**（或按 `Ctrl+Enter`）。
5. 看到 `Success. No rows returned` 即表示成功。

> 这个脚本会自动完成三件事：创建 `categories`、`posts`、`notes`、`api_tokens`、`pairing_tokens`、`settings` 六张表并启用行级安全（RLS）；自动创建名为 `uploads` 的**公开**图片存储桶；写入一条默认站点设置。你无需再去 Storage 页面手动建桶。

---

## 第三步：确认图片存储 Bucket

1. 左侧菜单点击 **Storage**，确认已出现名为 `uploads` 的 bucket，且 Public 列为开启状态。
2. 若初始化脚本执行时因网络原因中断，可在 Storage 手动新建 public bucket `uploads`（名称必须小写且完全一致），再到 SQL Editor 单独运行上方 `init.sql` 中「第 7 节」的策略代码。

---

## 第四步：获取连接密钥

1. 左侧菜单点击 **Project Settings**（齿轮图标）→ **API**。
2. 在 **API Keys** 区域复制以下三项（新版面板变量名），保存到记事本，马上要用：
   - **Project URL**（`SUPABASE_URL`，形如 `https://xxxx.supabase.co`）
   - **Publishable key**（`SUPABASE_PUBLISHABLE_KEY`）
   - **Secret key**（`SUPABASE_SECRET_KEY`）

> `service_role` key 拥有全部权限，**绝不能**泄露到前端。本项目的部署环境变量会安全地把它放在服务端。

---

## 第五步：一键部署到 Vercel

1. 打开 [https://vercel.com](https://vercel.com)，用 GitHub 账号登录。
2. 回到你的 GitHub，先 **Fork**（复刻）本项目仓库到你自己的账号下。
3. 在你 Fork 出来的仓库 README 里，点击 **Deploy to Vercel** 按钮（或手动：Vercel → Add New → Project → Import 你的仓库）。
4. Vercel 会自动识别为 Next.js 项目。在 **Environment Variables** 里添加以下四项：

| 变量名 | 值 |
|---|---|
| `SUPABASE_URL` | 你的 Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | 你的 Publishable key |
| `SUPABASE_SECRET_KEY` | 你的 Secret key |
| `NEXT_PUBLIC_SITE_URL` | 部署完成后你的域名（可先填 `https://你的项目名.vercel.app`） |

5. 点击 **Deploy**，等待构建完成。
6. 部署成功后，Vercel 会给你一个域名（如 `https://my-notes-xxx.vercel.app`）。
7. 如果你在第五步临时填的 `NEXT_PUBLIC_SITE_URL` 与实际域名不同，回到 Vercel 项目的 **Settings → Environment Variables**，改成正确域名，然后 **Redeploy**。

---

## 第六步：首次登录并完成设置

1. 打开你的站点域名，例如 `https://my-notes-xxx.vercel.app`。
2. 访问 `/auth/login`（首页下方也可进入后台），点击 **注册**，用你的邮箱创建一个作者账号。
3. 如果 Supabase 的注册邮件进了垃圾箱，请去垃圾箱找确认链接。
4. 登录后进入后台，先去 **设置** 页，填写你的站点名称、一句话简介、作者署名。
5. 点击 **写文章**，写一篇测试文章，选择「公开」，点「发布」。

至此，你的个人文字站点已经上线。访客打开你的域名即可阅读公开文章。

---

## 下一步

- 配置第三方登录（GitHub）：见 [02-configure-oauth.md](./02-configure-oauth.md)
- 安装浏览器速记插件：见 [03-install-extension.md](./03-install-extension.md)
- 配对插件：见 [04-pair-extension.md](./04-pair-extension.md)