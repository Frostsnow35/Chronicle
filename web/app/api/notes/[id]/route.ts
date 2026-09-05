import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, resolveAuthorFromRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("notes")
      .select(
        "id,content_html,content_json,source_url,images,created_at,updated_at"
      )
      .eq("id", params.id)
      .eq("author_id", authorId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const { error } = await admin
      .from("notes")
      .delete()
      .eq("id", params.id)
      .eq("author_id", authorId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
