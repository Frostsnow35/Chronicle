import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

let admin: SupabaseClient<Database> | undefined;

/**
 * Service Role 客户端：拥有所有 RLS 权限，仅可在 Server/API Route 使用。
 * 严禁暴露到浏览器端代码。
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!admin) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "缺少环境变量 SUPABASE_SERVICE_ROLE_KEY，无法执行服务端操作。"
      );
    }
    admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }
  return admin;
}
