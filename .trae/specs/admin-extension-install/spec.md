# 后台提供浏览器插件安装入口 Spec

## Why

当前插件只能通过阅读 `docs/03-install-extension.md` 手动「下载 + 开发者模式加载」，对非技术用户不友好。作者登录后台后，应当有一个清晰入口，点击即可跳转到 Chrome 应用店完成「添加至 Chrome」的一键安装，并配套完整的商店上架指引与回退路径。

## What Changes

- 新增后台「安装插件」页面 `/admin/plugin`（仅登录作者可见，复用现有 `/admin/**` 鉴权）。
- 页面提供「安装插件」主按钮，跳转 Chrome 应用店该插件页面（`target="_blank"` 新标签页）。
- 插件商店地址可配置：在站点设置中新增 `chrome_web_store_url` 字段，作者上架后可填入；未填时页面显示「尚未上架」引导。
- 后台侧边导航新增「安装插件」入口。
- 插件补齐商店上架必需素材（图标 16/48/128）与打包脚本（生成可提交商店的 ZIP）。
- 新增文档 `docs/06-publish-chrome-web-store.md`：上架 Chrome 应用店完整步骤（含 $5 开发者注册、隐私政策、截图、提交审核）。
- 保留「开发者模式加载」作为上架前的回退说明，指向既有 `docs/03-install-extension.md`。

## Impact

- Affected specs: 站点设置（`settings` 表的 `site` JSON）、后台导航、插件打包与上架。
- Affected code: `web/app/admin/plugin/page.tsx`（新增）、`web/app/admin/AdminLayoutClient.tsx`（导航）、`web/app/admin/settings/page.tsx`（新增字段）、`web/app/api/settings/route.ts`（GET/PUT 扩展字段）、`web/lib/data.ts`（`SiteSettings` 与 `DEFAULT_SITE`）、`extension/manifest.config.ts`（图标）、`extension/package.json`（打包脚本）、`extension/public/` 或 `extension/assets/`（图标资源）、`docs/06-publish-chrome-web-store.md`（新增）。

## ADDED Requirements

### Requirement: 后台插件安装页面
系统 SHALL 在后台 `/admin/plugin` 提供插件安装页面，仅登录作者可访问。

#### Scenario: 已配置商店地址
- **WHEN** 作者已在站点设置中填写了 Chrome 应用店地址并访问 `/admin/plugin`
- **THEN** 页面显示主按钮「安装插件」，点击后在新标签页打开该商店地址

#### Scenario: 尚未配置商店地址
- **WHEN** 作者未填写商店地址并访问 `/admin/plugin`
- **THEN** 页面显示「尚未上架 Chrome 应用店」提示、上架指引链接，以及开发者模式手动加载的回退说明

#### Scenario: 未登录访问
- **WHEN** 未登录访客直接访问 `/admin/plugin`
- **THEN** 被鉴权中间件重定向到登录页，无法看到该页面内容

### Requirement: 插件商店地址可配置
系统 SHALL 在站点设置中提供 `chrome_web_store_url` 字段，作者可填写并保存。

#### Scenario: 保存商店地址
- **WHEN** 作者在后台「设置」页填写商店地址并保存
- **THEN** 该地址持久化到 `settings` 表 `site` JSON，并在「安装插件」页生效

### Requirement: 插件商店上架素材与打包
插件 SHALL 具备 Chrome 应用店上架所需的图标与可提交 ZIP 产物。

#### Scenario: 生成商店打包产物
- **WHEN** 运行插件的打包命令
- **THEN** 生成包含 manifest、popup、options、service worker 与图标的 ZIP 文件，可供商店提交

### Requirement: 上架文档
系统 SHALL 提供 Chrome 应用店上架的完整文档，覆盖注册、素材准备、隐私政策、提交与审核。

#### Scenario: 作者参考文档上架
- **WHEN** 作者需要把插件发布到 Chrome 应用店
- **THEN** 可按文档逐步完成上架并获取商店地址

## MODIFIED Requirements

### Requirement: 站点设置模型
原站点设置 `site` JSON 仅含 `name`/`tagline`/`author`/`footer_text`。本次扩展 SHALL 新增 `chrome_web_store_url` 字段（可选，默认空字符串），并保持向后兼容：旧数据未含该字段时按空字符串处理。

### Requirement: 后台导航
后台侧边导航 SHALL 新增「安装插件」入口，指向 `/admin/plugin`。
