import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  readJsonBody,
  resolveAuthorFromRequest
} from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const { authorId } = await resolveAuthorFromRequest(req);
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("notes")
      .select("id,content_html,source_url,images,created_at,updated_at")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const body = await readJsonBody<{
      content_json?: any;
      content_html: string;
      source_url?: string;
      images?: string[];
    }>(req);
    if (!body.content_html || body.content_html.replace(/<[^>]+>/g, "").trim().length === 0) {
      throw Object.assign(new Error("笔记内容不能为空。"), { status: 400 });
    }
    const admin = getAdminClient();

    // 把 data:image 提取出来，上传到 Storage 替换 URL；若上传失败就保留 base64
    let processedHtml = body.content_html;
    const images: string[] = [];
    const base64Matches = Array.from(
      body.content_html.matchAll(/src="(data:image\/[^"]+)"/g) || []
    );
    for (const match of base64Matches) {
      const dataUrl = match[1];
      try {
        const url = await uploadDataUrlToStorage(authorId, dataUrl);
        if (url) {
          processedHtml = processedHtml.replace(dataUrl, url);
          images.push(url);
        }
      } catch {}
    }

    const { data, error } = await admin
      .from("notes")
      .insert({
        content_json: body.content_json ?? {},
        content_html: processedHtml,
        source_url: body.source_url ?? null,
        images,
        author_id: authorId
      })
      .select("id,created_at")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return apiErrorResponse(e);
  }
}

async function uploadDataUrlToStorage(
  authorId: string,
  dataUrl: string
): Promise<string | null> {
  const m = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const ext = m[1].split(";")[0].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const buf = Buffer.from(m[2], "base64");
  if (buf.byteLength > 6 * 1024 * 1024) return null; // > 6MB 放弃，保留 base64

  const admin = getAdminClient();
  const path = `notes/${authorId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from("uploads")
    .upload(path, buf, { contentType: `image/${m[1]}`, upsert: true });
  if (error) return null;
  const { data } = admin.storage.from("uploads").getPublicUrl(path);
  return data?.publicUrl || null;
}
