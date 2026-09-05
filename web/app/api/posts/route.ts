import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { extractExcerpt, makeSlug } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const visibility = searchParams.get("visibility");
    const categoryId = searchParams.get("category_id");
    const all = searchParams.get("all") === "1";

    const admin = getAdminClient();
    let query = admin.from("posts").select(
      "id,title,slug,excerpt,visibility,category_id,created_at,updated_at,cover_image,category:categories(id,name)"
    );
    // 只有从后台查文章：作者模式，只看自己
    let authorId: string | null = null;
    try {
      const r = await resolveAuthorFromRequest(req);
      authorId = r.authorId;
    } catch {}

    if (visibility === "public") {
      // do nothing
    }

    if (!authorId) {
      // 访客：只能看 public
      query = query.eq("visibility", "public");
    } else if (!all || visibility) {
      // 作者登录但指定了 visibility 或者 默认后台模式
      if (visibility === "public") query = query.eq("visibility", "public");
      else if (visibility === "private") {
        query = query.eq("visibility", "private").eq("author_id", authorId);
      }
      if (!visibility && !all) {
        // 默认后台视角：全部作者自己的所有文章
        query = query.eq("author_id", authorId);
      }
      if (!visibility && all) {
        // 管理员看全部（这里仅作者，不扩展）
        query = query.eq("author_id", authorId);
      }
    } else {
      // 作者登录默认看自己所有
      query = query.eq("author_id", authorId);
    }

    if (categoryId) query = query.eq("category_id", categoryId);
    query = query.order("created_at", { ascending: false });
    if (!all) query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      total: count ?? undefined,
      page,
      pageSize
    });
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{
      title: string;
      content_json?: any;
      content_html?: string;
      visibility?: "public" | "private";
      category_id?: string | null;
      cover_image?: string | null;
      slug?: string;
      excerpt?: string;
    }>(req);
    if (!body.title || !body.title.trim()) {
      throw Object.assign(new Error("文章标题不能为空。"), { status: 400 });
    }
    const admin = getAdminClient();
    const title = body.title.trim();
    const contentHtml = body.content_html ?? "";
    const excerpt = body.excerpt?.trim() || extractExcerpt(contentHtml, 180);
    const slug = body.slug?.trim() || makeSlug(title);

    const { data, error } = await admin
      .from("posts")
      .insert({
        title,
      slug,
        content_json: body.content_json ?? {},
      content_html: contentHtml,
      excerpt,
        visibility: body.visibility || "public",
      category_id: body.category_id ?? null,
      author_id: authorId,
      cover_image: body.cover_image ?? null
    })
      .select("id,slug")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}
