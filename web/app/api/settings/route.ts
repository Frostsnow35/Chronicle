import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEFAULT_SITE = {
  name: "Chronicle",
  tagline: "用文字锚定时间",
  author: "霜雪",
  footer_text: "为流动的日子留下凭据",
  chrome_web_store_url: ""
};

export async function GET() {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("key,value,updated_at")
      .eq("key", "site")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ value: DEFAULT_SITE });
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await resolveAuthorFromRequest(req);
    const body = await readJsonBody<Record<string, string>>(req);
    const admin = getAdminClient();
    const value = {
      name: body.name ?? DEFAULT_SITE.name,
      tagline: body.tagline ?? DEFAULT_SITE.tagline,
      author: body.author ?? DEFAULT_SITE.author,
      footer_text: body.footer_text ?? DEFAULT_SITE.footer_text,
      chrome_web_store_url: body.chrome_web_store_url ?? DEFAULT_SITE.chrome_web_store_url
    };
    const { data, error } = await admin
      .from("settings")
      .upsert({ key: "site", value }, { onConflict: "key" })
      .select("key,value,updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
