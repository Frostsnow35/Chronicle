# Chronicle · 极简文字记录平台

一套「独立部署的个人文字站点 + Chromium 浏览器速记插件」的完整开源方案。

每个用户使用自己的 Vercel + Supabase 免费额度部署自己的站点与数据库，拥有自己的独立域名，数据完全自管。

## 一键部署

点击下方按钮，用你自己的 Vercel + Supabase 免费额度部署一个完全属于自己的站点（数据自管，无需连接任何第三方服务）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFrostsnow35%2FChronicle&root-directory=web&env=SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SUPABASE_SECRET_KEY,NEXT_PUBLIC_SITE_URL)

> 部署前请先按 [部署文档](./docs/01-deploy-to-vercel-supabase.md) 创建 Supabase 数据库并运行初始化脚本，再回到此处点击部署按钮。

## 特性

- 极简主义设计：首屏爱马仕橙 + 天蓝渐变封面，全站流动渐变背景，衬线排版，居中窄幅大量留白，玻璃拟态卡片
- 作者后台：轻量富文本编辑器（标题 / 粗体 / 斜体 / 列表 / 引用 / 图片），文章按时间线或分类树管理，单篇可选公开 / 私密
- 访客体验：公开文章可浏览，内置微博 / X（Twitter）/ 复制链接分享按钮
- 浏览器速记插件：弹窗快速打字 / 插图，草稿自动缓存，一键短链接配对或手动配置连接到自己的站点
- 鉴权：邮箱密码 + GitHub / Google OAuth
- 部署：Vercel + Supabase 免费层一键部署，详尽分步图文指引

## 快速开始

1. 部署站点：阅读 [docs/01-deploy-to-vercel-supabase.md](./docs/01-deploy-to-vercel-supabase.md)
2. 配置第三方登录（可选）：阅读 [docs/02-configure-oauth.md](./docs/02-configure-oauth.md)
3. 安装浏览器插件：阅读 [docs/03-install-extension.md](./docs/03-install-extension.md)
4. 配对插件：阅读 [docs/04-pair-extension.md](./docs/04-pair-extension.md)
5. 常见问题：阅读 [docs/05-faq-troubleshooting.md](./docs/05-faq-troubleshooting.md)

## 架构

```
[ Chromium 插件 MV3 ] --HTTPS Bearer Token--> [ Next.js 14 on Vercel ] <--> [ Supabase PostgreSQL + Storage + Auth ]
     (速记编辑器 / 草稿 / 配置向导)              (访客前端 + 作者后台 + API)         (数据 / 鉴权 / 图片)
```

完整实施计划见 `.trae/documents/minimal_notes_platform_plan.md`。

## 本地开发

```bash
# 启动站点
cd web
npm install
npm run dev

# 构建插件（生成 extension/dist）
cd extension
npm install
npm run build
```