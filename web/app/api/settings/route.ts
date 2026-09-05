import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEFAULT_SITE = {
  name: "我的文字花园",
  tagline: "在这里，留下每一刻的思考。",
  author: "作者",
  footer_text: "愿每个字都不被辜负"
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
      footer_text: body.footer_text ?? DEFAULT_SITE.footer_text
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
