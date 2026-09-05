# Tasks

- [x] Task 1: 站点设置扩展 `chrome_web_store_url` 字段
  - [x] SubTask 1.1: 在 `web/lib/data.ts` 的 `SiteSettings` 接口与 `DEFAULT_SITE` 中新增 `chrome_web_store_url: string`（默认 `""`）
  - [x] SubTask 1.2: 在 `web/app/api/settings/route.ts` 的 `DEFAULT_SITE`、`GET` 返回与 `PUT` 写入逻辑中纳入 `chrome_web_store_url`
  - [x] SubTask 1.3: 在 `web/app/admin/settings/page.tsx` 的表单与 `Field` 中新增「插件商店地址」输入项
  - [x] SubTask 1.4: 运行 `web` 的 TypeScript 检查（`tsc --noEmit`）通过

- [x] Task 2: 新增后台「安装插件」页面 `/admin/plugin`
  - [x] SubTask 2.1: 创建 `web/app/admin/plugin/page.tsx`（客户端组件），读取 `/api/settings` 获取 `chrome_web_store_url`
  - [x] SubTask 2.2: 已配置商店地址时渲染主按钮「安装插件」，`<a target="_blank" rel="noopener noreferrer">` 打开商店地址，并附分步安装说明
  - [x] SubTask 2.3: 未配置时渲染「尚未上架」引导 + 指向 `docs/06-publish-chrome-web-store.md` 与 `docs/03-install-extension.md` 的回退说明
  - [x] SubTask 2.4: 在 `web/app/admin/AdminLayoutClient.tsx` 的 `NAV` 中新增「安装插件」入口（icon 用 `Download`）
  - [x] SubTask 2.5: 运行 `web` 构建（`next build`）通过

- [x] Task 3: 插件补齐商店上架素材与打包脚本
  - [x] SubTask 3.1: 在 `extension/manifest.config.ts` 中新增 `icons`（16/48/128）声明
  - [x] SubTask 3.2: 提供图标资源文件（16×16、48×48、128×128 PNG），放置于 `extension/public/icons/` 并在 manifest 中引用
  - [x] SubTask 3.3: 在 `extension/package.json` 新增 `package` 脚本，用 Node 脚本（`scripts/package.mjs`）将 `dist` 打包为可提交商店的 ZIP
  - [x] SubTask 3.4: 运行 `extension` 的 `npm run build` 与 `npm run package` 通过，确认 ZIP 内容完整

- [x] Task 4: 编写上架文档 `docs/06-publish-chrome-web-store.md`
  - [x] SubTask 4.1: 覆盖开发者注册（$5 一次性）、打包 ZIP、商店列表素材（图标/截图/描述）、隐私政策、提交与审核步骤
  - [x] SubTask 4.2: 说明上架后如何把商店地址回填到后台「设置 → 插件商店地址」，使「安装插件」按钮生效

# Task Dependencies

- [Task 2] 依赖 [Task 1]（页面读取的 `chrome_web_store_url` 需先由 Task 1 提供）
- [Task 3] 与 [Task 1][Task 2] 无依赖，可并行
- [Task 4] 依赖 [Task 3]（文档需引用打包脚本与图标产物的真实名称）
