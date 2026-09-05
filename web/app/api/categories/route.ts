import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, readJsonBody, resolveAuthorFromRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("categories")
      .select("id,name,parent_id,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{
      name: string;
      parent_id?: string | null;
      sort_order?: number;
    }>(req);
    if (!body.name?.trim()) {
      throw Object.assign(new Error("分类名称不能为空。"), { status: 400 });
    }
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("categories")
      .insert({
        name: body.name.trim(),
        parent_id: body.parent_id ?? null,
        sort_order: body.sort_order ?? 0
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
