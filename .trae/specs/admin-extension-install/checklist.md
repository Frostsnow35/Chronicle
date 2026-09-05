# Checklist

- [x] `SiteSettings` 接口与 `DEFAULT_SITE` 含 `chrome_web_store_url` 字段，默认空字符串
- [x] `/api/settings` 的 GET 与 PUT 正确读写 `chrome_web_store_url`，旧数据缺失时按空字符串处理（向后兼容）
- [x] 后台「设置」页新增「插件商店地址」输入项并可保存
- [x] 后台新增 `/admin/plugin` 页面，未登录访问被重定向到登录页（复用 `/admin/**` 鉴权中间件）
- [x] 已配置商店地址时，「安装插件」按钮在新标签页打开商店地址
- [x] 未配置商店地址时，显示「尚未上架」引导与开发者模式回退说明
- [x] 后台侧边导航新增「安装插件」入口
- [x] 插件 manifest 声明 16/48/128 图标，图标资源存在且可被引用
- [x] 插件打包脚本生成内容完整的商店 ZIP（manifest.json 位于 ZIP 根级）
- [x] `web` 的 TypeScript 检查与 `next build` 通过
- [x] `extension` 的 `npm run build` 与 `npm run package` 通过
- [x] `docs/06-publish-chrome-web-store.md` 覆盖注册、打包、素材、隐私政策、提交审核与地址回填
