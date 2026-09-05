import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, readJsonBody } from "@/lib/auth";
import { exchangePairingForApiToken } from "@/lib/pairing";

export const runtime = "nodejs";

/**
 * 插件调用：把一次性 pairing token 换成长效的 API Token。
 * 无登录态。限频：单 IP 5 次/分钟。
 */
const LIMITER = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "_";
    const now = Date.now();
    const entry = LIMITER.get(ip);
    if (!entry || entry.resetAt < now) {
      LIMITER.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count += 1;
      if (entry.count > 5) {
        return NextResponse.json(
          { error: "请求过于频繁，请稍后再试。" },
          { status: 429 }
        );
      }
    }
    const body = await readJsonBody<{ token?: string }>(req);
    if (!body.token)
      throw Object.assign(new Error("缺少 token 字段。"), { status: 400 });
    const result = await exchangePairingForApiToken(body.token);
    return NextResponse.json(result);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
