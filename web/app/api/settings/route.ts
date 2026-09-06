import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileByUserId } from "@/lib/data";

export const runtime = "nodejs";

/**
 * 读取当前作者的用户资料（用户名 / 昵称 / 头像 / 简介 / 主题 / 只读邮箱 / 是否有密码）。
 * 资料存于 profiles 表，邮箱与密码能力来自 Supabase Auth。
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

    const profile = await getProfileByUserId(user.id);
    return NextResponse.json({
      username: profile?.username ?? "",
      display_name: profile?.display_name ?? "",
      avatar_url: profile?.avatar_url ?? "",
      bio: profile?.bio ?? "",
      theme: profile?.theme ?? "orange",
      email: user.email ?? "",
      has_password: user.app_metadata?.provider === "email"
    });
  } catch (e) {
    return apiErrorResponse(e);
  }
}

/**
 * 保存用户资料（昵称 / 头像 / 简介 / 主题），写回 profiles 表。
 */
export async function PUT(req: NextRequest) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{
      display_name?: string;
      avatar_url?: string;
      bio?: string;
      theme?: string;
    }>(req);

    const patch: {
      display_name?: string;
      avatar_url?: string;
      bio?: string;
      theme?: string;
    } = {};
    if (body.display_name !== undefined)
      patch.display_name = body.display_name.trim().slice(0, 40);
    if (body.avatar_url !== undefined) patch.avatar_url = body.avatar_url;
    if (body.bio !== undefined) patch.bio = body.bio.trim().slice(0, 200);
    if (body.theme !== undefined) patch.theme = body.theme === "blue" ? "blue" : "orange";

    const admin = getAdminClient();
    // profiles 行由注册触发器保证存在，直接 update，避免 upsert 需要必填 username
    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", authorId)
      .select("username,display_name,avatar_url,bio,theme")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
