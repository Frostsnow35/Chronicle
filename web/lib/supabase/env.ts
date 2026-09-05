/**
 * Supabase 环境变量集中解析。
 *
 * 同时兼容两套命名：
 *   - 新版 Supabase Dashboard 推荐（可直接粘贴）：
 *       SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY / SUPABASE_JWKS_URL
 *   - 旧版命名（历史兼容）：
 *       NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
 *
 * 浏览器可见的变量必须带 NEXT_PUBLIC_ 前缀；next.config.js 会在构建期把
 * SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 映射为 NEXT_PUBLIC_* 注入，
 * 因此部署时仅填写 Dashboard 的新变量名即可。
 */

export function supabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  );
}

/** 公开 key（anon / publishable），可用于浏览器与 Cookie 会话客户端 */
export function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  );
}

/** 服务端特权 key（service_role / secret），仅允许在服务端使用 */
export function supabaseSecretKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}
