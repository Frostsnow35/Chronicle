import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{
      name?: string;
      parent_id?: string | null;
      sort_order?: number;
    }>(req);
    const admin = getAdminClient();

    const existing = await admin
      .from("categories")
      .select("id,author_id")
      .eq("id", params.id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.data.author_id !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const patch: any = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.parent_id !== undefined) patch.parent_id = body.parent_id;
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order;

    const { data, error } = await admin
      .from("categories")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const admin = getAdminClient();

    const existing = await admin
      .from("categories")
      .select("id,author_id")
      .eq("id", params.id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.data.author_id !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 若有子分类则拒绝删除，要求先移动/删除子分类（仅限本人子分类）
    const { data: children } = await admin
      .from("categories")
      .select("id")
      .eq("parent_id", params.id)
      .eq("author_id", authorId)
      .limit(1);
    if (children && children.length > 0) {
      throw Object.assign(
        new Error("该分类下还有子分类，请先移动或删除子分类。"),
        { status: 400 }
      );
    }
    const { error } = await admin.from("categories").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
