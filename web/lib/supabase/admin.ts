import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { supabaseUrl, supabaseSecretKey } from "./env";

let admin: SupabaseClient<Database> | undefined;

/**
 * Service Role 客户端：拥有所有 RLS 权限，仅可在 Server/API Route 使用。
 * 严禁暴露到浏览器端代码。
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!admin) {
    if (!supabaseSecretKey()) {
      throw new Error(
        "缺少环境变量 SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY，无法执行服务端操作。"
      );
    }
    admin = createClient<Database>(
      supabaseUrl(),
      supabaseSecretKey(),
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
