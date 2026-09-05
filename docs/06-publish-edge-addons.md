# 06 · 发布插件到 Microsoft Edge 应用商店

本文说明如何把 Chronicle 浏览器插件发布到 Microsoft Edge 应用商店（通过 Microsoft Partner Center），从而让后台「安装插件」按钮可以一键跳转安装。

> 发布到 Edge 应用商店免费，不需要支付开发者注册费。Chromium 内核浏览器（Edge / Chrome / Brave 等）共用同一份 MV3 插件包。

## 一、打包插件 ZIP

1. 在 `extension` 目录安装依赖并构建：

   ```bash
   cd extension
   npm install
   npm run build
   npm run package
   ```

2. 完成后会在 `extension` 目录生成 `chronicle-extension.zip`，其中 `manifest.json` 位于 ZIP 根级、包含 16/48/128 三档图标。这个 ZIP 就是要提交的产物。

> 图标目前是占位的橙蓝渐变 + 字母「C」。你可以自行替换 `extension/public/icons/` 下的 `icon16.png` / `icon48.png` / `icon128.png`，重新 `npm run build && npm run package` 即可。

## 二、注册 Microsoft Partner Center 开发者账号

1. 打开 [Microsoft Partner Center](https://partner.microsoft.com/)，用 Microsoft 账号登录。
2. 首次使用需要完成开发者注册，步骤为「工作区 → 扩展」：
   - 填写发布者显示名称（会公开显示，例如 Chronicle）；
   - 填写联系人邮箱；
   - 接受协议并验证。注册免费。

## 三、提交新条目

1. 进入 Partner Center → 工作区 → **扩展** → 「新建扩展」。
2. 上传第一步生成的 `chronicle-extension.zip`。
3. 按页面分步填写：
   - **名称 / 副标题 / 描述**：商店列表将展示这些内容，可使用与 Chrome 应用店相同的文案；
   - **搜索词**：可填 chronicle、notes、速记、灵感等；
   - **图标**：上传 128×128 图标（`extension/public/icons/icon128.png`）；
   - **截图**：至少 1 张（建议覆盖弹出窗口、设置页、配对页）。
4. 发布选项与受众、声明与合规（隐私政策）等按提示填写完整，隐私政策 URL 可使用仓库中的 [PRIVACY.md](https://github.com/Frostsnow35/Chronicle/blob/main/PRIVACY.md)。

## 四、隐私政策

Chrome / Edge 商店均要求隐私政策。因为 Chronicle 是独立部署模式，插件的所有数据都保存到**用户自己部署的 Supabase 数据库**，开发者不收集、不存储、不处理任何用户数据。

在商店表单的隐私政策 URL 中填写：

```
https://github.com/Frostsnow35/Chronicle/blob/main/PRIVACY.md
```

## 五、提交与审核

1. 填写完整后点击「保存并发布」或「提交审阅」。
2. Edge 审核通常需要 1–5 个工作日。审核通过后，插件会出现在 Edge 应用商店，并获得形如：
   ```
   https://microsoftedge.microsoft.com/addons/detail/<你的插件ID>
   ```
   的商店地址（在 Partner Center 扩展详情页可复制「扩展链接 / Extension link」）。

## 六、回填商店地址，启用一键安装

1. 登录你的 Chronicle 站点后台 → 设置。
2. 在「插件商店地址（Edge 应用商店）」填入上面的商店地址，保存。
3. 回到后台「安装插件」页，此时会出现「前往 Edge 应用商店安装」按钮，点击即可在 Microsoft Edge 中完成「获取」安装。

## 常见问题

- **提交后状态一直是 In review**：Edge 审核需要数个工作日，属正常。期间可继续在 Partner Center 的扩展详情中修改资料并重新提交。
- **上传 ZIP 提示无效**：请确认使用 `npm run package` 生成的 `chronicle-extension.zip`（ZIP 根级必须直接是 manifest.json，不能多一层外层文件夹）。
- **被要求说明权限**：当前权限仅 `storage`（本地保存草稿/配对信息）与 `alarms`（离线重试定时器），以及 `host_permissions: <all_urls>`。理由见商店表单填写说明：用户部署 Chronicle 到各自任意域名，扩展需要向用户自己配置的站点发送笔记请求；扩展不含 content script，不读取网页内容。
- **不想上架**：可继续使用「开发者模式手动加载」自用，见 [03-install-extension.md](./03-install-extension.md)。此方式免费，但需手动加载、无自动更新。
