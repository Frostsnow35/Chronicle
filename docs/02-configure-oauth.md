# 02 · 配置 GitHub 登录

本项目支持邮箱密码登录，同时可选开启 GitHub 一键登录。这一步是可选的，但推荐配置，因为更方便。

## 两处回调地址（容易填反，注意区分）

1. **GitHub 里的 Authorization callback URL**：填你 Supabase 项目的地址
   `https://<项目ref>.supabase.co/auth/v1/callback`
   （`<项目ref>` 是 `SUPABASE_URL` 里 `.supabase.co` 前的一段。本项目为 `cnrisnqhbornsfpqasor`，即填 `https://cnrisnqhbornsfpqasor.supabase.co/auth/v1/callback`）

2. **Supabase 里的 Redirect URLs**：Authentication → URL Configuration 中添加你的站点地址
   `https://你的正式域名/auth/callback`
   例如 `https://my-notes-xxx.vercel.app/auth/callback`

---

## 配置 GitHub 登录

1. 打开 [https://github.com/settings/developers](https://github.com/settings/developers)，进入 **OAuth Apps**。
2. 点击 **New OAuth App**（注意选 OAuth App，不是 GitHub App）。
3. 填写：
   - **Application name**：随便填，如 `Chronicle`
   - **Homepage URL**：你的站点正式域名，如 `https://my-notes-xxx.vercel.app`
   - **Authorization callback URL**（部分界面显示为 Redirect URL / Callback URL，含义相同）：按上文两处回调地址的第 1 条填
4. 点击 **Register application**。
5. 复制 **Client ID**，再点击 **Generate a new client secret** 复制 **Client Secret**（只显示一次）。
6. 回到 Supabase 控制台：**Authentication → Providers → GitHub**。
7. 打开开关，填入 Client ID 和 Client Secret，**Save**。

---

## 常见问题

- **登录后跳回登录页**：检查 Supabase → Authentication → URL Configuration → Redirect URLs 是否包含你的正式域名 + `/auth/callback`，结尾不要多 `/`。
- **GitHub 提示 redirect_uri mismatch**：检查 GitHub OAuth App 里的 Authorization callback URL 是否与你 Supabase 项目 ref 完全一致。
- **邮箱注册收不到确认邮件**：Supabase 免费版发信有限额且有延迟；可在 Authentication → Email 里临时关闭 Confirm email，或等待几分钟重试。

配置完成后，登录页就会出现 GitHub 登录按钮。