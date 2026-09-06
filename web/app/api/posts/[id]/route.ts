import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { extractExcerpt, makeSlug } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const admin = getAdminClient();
    let authorId: string | null = null;
    try {
      authorId = (await resolveAuthorFromRequest(req)).authorId;
    } catch {}

    let q = admin
      .from("posts")
      .select(
        "id,title,slug,content_json,content_html,excerpt,visibility,category_id,created_at,updated_at,cover_image,author_id,category:categories(id,name)"
      )
      .eq("id", id);

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isPublic = data.visibility === "public";
    const isOwner = authorId === data.author_id;
    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: "私密文章" }, { status: 404 });
    }
    // 私密文章不返回 content 给非作者
    if (!isOwner) {
      (data as any).content_json = null;
    }
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const id = params.id;
    const admin = getAdminClient();
    const existing = await admin
      .from("posts")
      .select("id,author_id,slug")
      .eq("id", id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.data.author_id !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await readJsonBody<{
      title?: string;
      content_json?: any;
      content_html?: string;
      visibility?: "public" | "private";
      category_id?: string | null;
      cover_image?: string | null;
      slug?: string;
      excerpt?: string;
    }>(req);
    const patch: any = {};
    if (body.title !== undefined) {
      patch.title = body.title.trim();
      if (!patch.title)
        throw Object.assign(new Error("文章标题不能为空。"), { status: 400 });
    }
    if (body.content_json !== undefined) patch.content_json = body.content_json;
    if (body.content_html !== undefined) patch.content_html = body.content_html;
    if (body.visibility !== undefined) patch.visibility = body.visibility;
    if (body.category_id !== undefined) patch.category_id = body.category_id;
    if (body.cover_image !== undefined) patch.cover_image = body.cover_image;
    if (body.slug !== undefined) patch.slug = body.slug.trim() || makeSlug(patch.title || "untitled");
    if (
      body.excerpt !== undefined ||
      body.content_html !== undefined ||
      body.title !== undefined
    ) {
      patch.excerpt =
        body.excerpt?.trim() ||
        extractExcerpt(
          body.content_html ?? "",
          180
        );
    }
    const { data, error } = await admin
      .from("posts")
      .update(patch)
      .eq("id", existing.data.id)
      .select("id,slug")
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
    const id = params.id;
    const admin = getAdminClient();
    const existing = await admin
      .from("posts")
      .select("id,author_id")
      .eq("id", id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.data.author_id !== authorId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await admin.from("posts").delete().eq("id", existing.data.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
