import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { isValidUsername, normalizeUsername } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * 设置当前用户的空间用户名（用于 OAuth 用户首次登录补填）。
 */
export async function POST(req: NextRequest) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{ username?: string }>(req);

    const username = normalizeUsername(body.username ?? "");
    if (!isValidUsername(username)) {
      throw Object.assign(
        new Error("用户名需为 3–30 位，仅含小写字母、数字、连字符或下划线。"),
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing && existing.id !== authorId) {
      throw Object.assign(new Error("该用户名已被占用，请换一个。"), {
        status: 409
      });
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ username })
      .eq("id", authorId)
      .select("username,display_name,avatar_url,bio,theme")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
