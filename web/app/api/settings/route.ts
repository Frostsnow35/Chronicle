import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const USER_KEY = "user";

interface UserProfile {
  display_name: string;
  avatar_url: string;
}

/**
 * 读取当前作者的用户资料（昵称 / 头像 / 只读邮箱 / 是否有密码）。
 * 资料存于 settings 表的 user 行，邮箱与密码能力来自 Supabase Auth。
 */
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("value")
      .eq("key", USER_KEY)
      .maybeSingle();
    if (error) throw error;

    const value = (data?.value ?? {}) as Partial<UserProfile>;
    return NextResponse.json({
      display_name: typeof value.display_name === "string" ? value.display_name : "",
      avatar_url: typeof value.avatar_url === "string" ? value.avatar_url : "",
      email: user.email ?? "",
      has_password: user.app_metadata?.provider === "email"
    });
  } catch (e) {
    return apiErrorResponse(e);
  }
}

/**
 * 保存用户资料（昵称 / 头像），写回 settings 表的 user 行。
 */
export async function PUT(req: NextRequest) {
  try {
    await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{ display_name?: string; avatar_url?: string }>(req);

    const value: Record<string, string> = {
      display_name: (body.display_name ?? "").trim().slice(0, 40),
      avatar_url: typeof body.avatar_url === "string" ? body.avatar_url : ""
    };

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .upsert({ key: USER_KEY, value }, { onConflict: "key" })
      .select("value")
      .single();
    if (error) throw error;

    return NextResponse.json({ value: data.value });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
