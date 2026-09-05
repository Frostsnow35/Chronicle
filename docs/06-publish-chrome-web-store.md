# 06 · 发布插件到 Chrome 应用店

本文说明如何把 Chronicle 浏览器插件发布到 Chrome 应用店（Chrome Web Store），从而让后台「安装插件」按钮可以一键跳转安装。

> 发布到 Chrome 应用店需要一次性 5 美元开发者注册费。之后可免费更新、自动分发，体验最完整。

## 一、打包插件 ZIP

1. 在 `extension` 目录安装依赖并构建：

   ```bash
   cd extension
   npm install
   npm run build
   npm run package
   ```

2. 完成后会在 `extension` 目录生成 `chronicle-extension.zip`，其中 `manifest.json` 位于 ZIP 根级、包含 16/48/128 三档图标。这个 ZIP 就是要提交给商店的产物。

> 图标目前是占位的橙蓝渐变 + 字母「C」。你可以自行替换 `extension/public/icons/` 下的 `icon16.png` / `icon48.png` / `icon128.png`（128×128 为商店主图标），重新 `npm run build && npm run package` 即可。

## 二、注册 Chrome 开发者账号

1. 打开 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)。
2. 用 Google 账号登录，按提示支付一次性 5 美元注册费。
3. 填写开发者信息（名称、邮箱、地址等，商店会显示开发者名称）。

## 三、提交新条目

1. 在 Developer Dashboard 点击「新增项目 / New item」。
2. 上传第一步生成的 `chronicle-extension.zip`。
3. 填写商店信息：
   - **名称**：Chronicle
   - **摘要 / 描述**：
     ```
     用文字锚定时间：在浏览器里随时记下灵感，支持文字和图片，保存到你自己部署的 Chronicle 站点。
     ```
   - **分类**：生产力（Productivity）
   - **语言**：中文（简体）
4. 准备并上传 **商店素材**：
   - **图标**：128×128 PNG（`extension/public/icons/icon128.png`）
   - **截图**：至少 1 张 1280×800 或 640×400 的插件界面截图（弹出窗口、设置页、配对页各截一张更佳）
   - **小型宣传图 / 大型宣传图**：按提示尺寸制作（可选但推荐）

## 四、隐私政策（必填）

Chrome 应用店要求填写隐私政策链接。因为 Chronicle 是独立部署模式，插件的所有数据都保存到**用户自己部署的 Supabase 数据库**，开发者不收集、不存储、不处理任何用户数据。

你可以新建一个公开页面（例如 GitHub 仓库根目录放一份 `PRIVACY.md` 或站点 `/privacy` 页）作为隐私政策地址，内容说明：

```
Chronicle 插件不会收集或上传任何个人信息。你在插件中输入的笔记与图片
仅保存到你本人在 Chronicle 站点部署时连接的 Supabase 数据库，并由你
自己管理。插件不包含任何第三方分析、追踪或广告代码。当你删除站点或
数据库时，相关数据随之一并删除。
```

把该页面的公开 URL 填入商店的「隐私政策」字段。

## 五、提交与审核

1. 填完上述信息后点击「提交审核」。
2. Chrome 审核通常需要数天。审核通过后，插件会出现在商店，并获得形如：
   ```
   https://chromewebstore.google.com/detail/<你的插件ID>
   ```
   的商店地址。

## 六、回填商店地址，启用一键安装

1. 登录你的 Chronicle 站点后台 → 设置。
2. 在「插件商店地址（Chrome 应用店）」填入上面的商店地址，保存。
3. 回到后台「安装插件」页，此时会出现「前往 Chrome 应用店安装」按钮，点击即可在新标签页完成「添加至 Chrome」。

## 常见问题

- **审核不通过**：通常与 `host_permissions`（`<all_urls>`）有关。Chrome 会要求解释为何需要访问所有站点。说明文案可写：插件在任意网页上以弹出窗口记录笔记，不读取网页内容，仅在自己部署的站点上传用户主动输入的笔记。如被要求收窄权限，可将 `host_permissions` 改为仅你的站点域名，但会牺牲「任意网页打开弹窗记笔记」的便利。
- **不想付费上架**：可继续使用「开发者模式手动加载」自用，见 [03-install-extension.md](./03-install-extension.md)。此方式免费，但需手动加载、无自动更新。
