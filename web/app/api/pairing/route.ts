import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  consumePairingToken,
  exchangePairingForApiToken,
  generatePairingLink
} from "@/lib/pairing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 当前作者名下所有 API Token（不返回明文，仅 id/name/last_used_at/created_at/expires_at）
    const { authorId } = await resolveAuthorFromRequest(req);
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("api_tokens")
      .select("id,name,created_at,last_used_at,expires_at")
      .eq("owner_id", authorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

// ==========================================================================
// POST /api/pairing 支持两种 action：
//   { "action": "generate" }                      → 作者登录态生成一次性配对链接
//   { "action": "issue-token", "name": "..." }    → 作者登录态手动生成一个长期 API Token
//   { "action": "revoke-token", "id": "uuid" }    → 作者吊销自己的一个 Token
// 插件调用单独走 /api/pairing/exchange (POST)
// ==========================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{
      action?: string;
      name?: string;
      id?: string;
    }>(req);
    const action = body.action || "generate";

    if (action === "generate") {
      const { authorId } = await resolveAuthorFromRequest(req);
      const link = await generatePairingLink(authorId);
      return NextResponse.json(link);
    }
    if (action === "issue-token") {
      const { authorId } = await resolveAuthorFromRequest(req);
      const { issueApiToken } = await import("@/lib/auth");
      const t = await issueApiToken(authorId, body.name?.trim() || "自定义 Token");
      return NextResponse.json(t);
    }
    if (action === "revoke-token") {
      if (!body.id)
        throw Object.assign(new Error("缺少 id。"), { status: 400 });
      const { authorId } = await resolveAuthorFromRequest(req);
      const admin = getAdminClient();
      const { error } = await admin
        .from("api_tokens")
        .delete()
        .eq("id", body.id)
        .eq("owner_id", authorId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    throw Object.assign(new Error("未知的 action。"), { status: 400 });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
