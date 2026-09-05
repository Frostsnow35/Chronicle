# 02 · 配置第三方登录（GitHub / Google）

本项目支持邮箱密码登录，同时可选开启 GitHub / Google 一键登录。这一步是可选的，但推荐配置，因为更方便。

## 通用回调地址

无论配置哪个 OAuth，回调地址统一为：

```
https://你的域名/auth/callback
```

例如 `https://my-notes-xxx.vercel.app/auth/callback`。

---

## 一、配置 GitHub 登录

1. 打开 [https://github.com/settings/developers](https://github.com/settings/developers)。
2. 点击 **New OAuth App**。
3. 填写：
   - **Application name**：随便填，如 `My Notes`
   - **Homepage URL**：你的站点域名，如 `https://my-notes-xxx.vercel.app`
   - **Authorization callback URL**：`https://你的域名/auth/callback`
4. 点击 **Register application**。
5. 复制 **Client ID**，再点击 **Generate a new client secret** 复制 **Client Secret**。
6. 回到 Supabase 控制台：**Authentication → Providers → GitHub**。
7. 打开开关，填入 Client ID 和 Client Secret，**Save**。

---

## 二、配置 Google 登录

1. 打开 [https://console.cloud.google.com](https://console.cloud.google.com)。
2. 新建一个项目（或选择已有项目）。
3. 左侧菜单 **APIs & Services → OAuth consent screen**：
   - 选择 **External**，填写应用名称、支持邮箱，保存。
   - 在 **Test users** 里添加你自己的邮箱（否则非测试用户无法登录）。
4. 左侧菜单 **Credentials → Create Credentials → OAuth client ID**：
   - Application type 选 **Web application**
   - **Authorized redirect URIs** 填 `https://你的域名/auth/callback`
5. 创建后复制 **Client ID** 和 **Client Secret**。
6. 回到 Supabase：**Authentication → Providers → Google**，打开开关，填入并保存。

---

## 常见问题

- **登录后跳回登录页**：确认回调地址和 Supabase 里填的完全一致（注意结尾不要多 `/`）。
- **Google 提示 403 access denied**：在 OAuth consent screen 的 Test users 里添加了自己的邮箱后，需等待几分钟生效。
- **GitHub 提示 redirect_uri mismatch**：检查 Homepage URL 与 callback URL 的域名是否与当前站点域名一致。

配置完成后，登录页就会出现 GitHub / Google 按钮。
