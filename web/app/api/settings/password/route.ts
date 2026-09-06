import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, readJsonBody } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * 修改当前作者密码。
 * 仅对邮箱密码登录的账号有效，GitHub 登录账号无密码，前端会隐藏此入口。
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody<{ password?: string }>(req);
    const password = (body.password ?? "").trim();
    if (password.length < 6) {
      return NextResponse.json({ error: "新密码至少 6 位。" }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
