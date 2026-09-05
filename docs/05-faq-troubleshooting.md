# 05 · 常见问题与排查（FAQ）

## 部署相关

### Vercel 构建失败
- 打开 Vercel 项目的 **Deployments** 查看构建日志。
- 最常见原因是环境变量没填全，尤其 `NEXT_PUBLIC_SUPABASE_URL` 或 `SUPABASE_SERVICE_ROLE_KEY` 缺失。
- 确认环境变量名**完全一致**（注意大小写和前缀 `NEXT_PUBLIC_`）。

### 打开站点报错 `缺少环境变量 SUPABASE_SERVICE_ROLE_KEY`
- 说明服务端没读到 `SUPABASE_SERVICE_ROLE_KEY`。
- 到 Vercel → 你的项目 → **Settings → Environment Variables**，确认已添加，然后 **Redeploy**。

### 图片上传后不显示
- 确认 Supabase Storage 里创建了名为 `uploads` 的 bucket，且勾选了 **Public**。
- 确认 `web/supabase/init.sql` 里的 Storage 策略已运行。

---

## Supabase 相关

### 访问后台报 `new row violates row-level security policy`（403）
- 说明 RLS 策略没生效或 `init.sql` 没运行完整。
- 回到 Supabase → SQL Editor，重新粘贴运行一次 `web/supabase/init.sql`。

### 私密文章被访客看到了
- 检查该文章在编辑器的「公开/私密」开关是否为「公开」。
- 检查 `posts` 表 RLS 策略：访客应只能 `select` 到 `visibility = 'public'` 的行。

### Supabase 免费项目被暂停
- Supabase 免费层项目若 7 天完全无活动，可能被暂停。
- 建议至少每月登录一次 Supabase Dashboard，或升级到 Pro。

### 免费额度用尽
- 免费层含约 500MB 数据库存储、5GB 带宽/月。
- 接近上限时，可升级 Pro，或自行导出数据迁移到自建 PostgreSQL。

---

## 浏览器插件相关

### 插件图标点开是空白 / 提示未配置
- 首次使用需要先配对。点击「立即配置插件」完成配对。

### 保存提示「授权失效，请重新配对」
- Token 失效或已吊销，重新走一遍配对流程即可（见 [04](./04-pair-extension.md)）。

### 插件保存报网络错误 / 无法连接
- 检查站点域名是否可访问、是否填写了完整 `https://` 前缀。
- 检查你的站点是否开启了防火墙限制（Vercel 默认不限制）。

### 图片在插件里能显示，保存后不显示
- 图片上传依赖站点的 `/api/storage/upload` 接口，确认该接口可用、Storage bucket 正常。

---

## 其他

### 想让自己的域名（如 `notes.我的域名.com`）指向站点
- Vercel 项目 → **Settings → Domains** → 添加自定义域名。
- 按提示在你的域名服务商处添加 CNAME 记录。
- 添加后，把 `NEXT_PUBLIC_SITE_URL` 改成新域名并 Redeploy。

### 想自定义主题色 / 字体
- 颜色定义在 `web/tailwind.config.ts` 的 `colors`。
- 字体在 `web/styles/globals.css` 顶部的 `@import` 和 `font-family`。
- 修改后重新部署即可生效。

### 数据想备份/迁移
- 数据都在你自己的 Supabase 里，可随时在 Dashboard 导出，或连接任意 PostgreSQL 客户端读取。
