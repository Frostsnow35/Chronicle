import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * 读取插件商店地址（供「安装插件」页使用）。
 */
export async function GET() {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();
    if (error) throw error;

    const value = (data?.value ?? {}) as Record<string, unknown>;
    return NextResponse.json({
      chrome_web_store_url:
        typeof value.chrome_web_store_url === "string" ? value.chrome_web_store_url : ""
    });
  } catch (e) {
    return apiErrorResponse(e);
  }
}

/**
 * 保存插件商店地址，保留 site 行的其它既有字段。
 */
export async function PUT(req: NextRequest) {
  try {
    await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{ chrome_web_store_url?: string }>(req);

    const admin = getAdminClient();
    const { data: existing } = await admin
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();

    const value = {
      ...((existing?.value ?? {}) as Record<string, unknown>),
      chrome_web_store_url:
        typeof body.chrome_web_store_url === "string" ? body.chrome_web_store_url : ""
    };

    const { data, error } = await admin
      .from("settings")
      .upsert({ key: "site", value }, { onConflict: "key" })
      .select("value")
      .single();
    if (error) throw error;

    return NextResponse.json({ value: data.value });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
