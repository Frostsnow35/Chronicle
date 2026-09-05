import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, resolveAuthorFromRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
