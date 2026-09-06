import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, readJsonBody, resolveAuthorFromRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export const runtime = "nodejs";

/**
 * 压缩上传图片：
 *  - 光栅图（jpeg/png/webp 等）转 webp、限宽 1920、质量 80、按 EXIF 自动旋转
 *  - svg / gif 原样返回（避免破坏矢量与动图）
 */
async function compressImage(
  buf: Buffer,
  mimeType: string
): Promise<{ buf: Buffer; mimeType: string; ext: string }> {
  if (mimeType === "image/svg+xml" || mimeType === "image/gif") {
    return { buf, mimeType, ext: mimeType === "image/svg+xml" ? "svg" : "gif" };
  }
  const out = await sharp(buf)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return { buf: out, mimeType: "image/webp", ext: "webp" };
}

/**
 * 图片上传接口：
 *  - Web 作者后台、插件调用。两种方式：
 *     1) multipart/form-data 上传图片文件
 *     2) application/json { dataUrl: "data:image/png;base64,..." }
 *  - 返回 { url }：Supabase Storage 的公开 URL
 */
export async function POST(req: NextRequest) {
  try {
    const { authorId } = await resolveAuthorFromRequest(req);
    const contentType = req.headers.get("content-type") || "";
    let buf: Buffer;
    let ext: string;
    let mimeType: string;

    if (contentType.startsWith("application/json")) {
      const body = await readJsonBody<{ dataUrl?: string }>(req);
      if (!body.dataUrl) throw Object.assign(new Error("缺少 dataUrl。"), { status: 400 });
      const m = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(body.dataUrl);
      if (!m)
        throw Object.assign(new Error("dataUrl 格式错误。"), { status: 400 });
      mimeType = `image/${m[1]}`;
      ext = m[1]
        .split(";")[0]
        .replace("jpeg", "jpg")
        .replace("svg+xml", "svg");
      buf = Buffer.from(m[2], "base64");
      if (buf.byteLength > 8 * 1024 * 1024)
        throw Object.assign(new Error("图片大小上限 8MB。"), { status: 413 });
    } else if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw Object.assign(new Error("缺少 file 字段。"), { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        throw Object.assign(new Error("只接受图片文件。"), { status: 400 });
      }
      if (file.size > 8 * 1024 * 1024) {
        throw Object.assign(new Error("图片大小上限 8MB。"), { status: 413 });
      }
      const ab = await file.arrayBuffer();
      buf = Buffer.from(ab);
      mimeType = file.type;
      ext = file.name.split(".").pop()?.toLowerCase() || "png";
    } else {
      throw Object.assign(new Error("不支持的 Content-Type。"), { status: 400 });
    }

    const admin = getAdminClient();
    const compressed = await compressImage(buf, mimeType);
    buf = compressed.buf;
    mimeType = compressed.mimeType;
    ext = compressed.ext;
    const path = `uploads/${authorId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { error } = await admin.storage
      .from("uploads")
      .upload(path, buf, { contentType: mimeType, upsert: true });
    if (error) throw error;

    const { data } = admin.storage.from("uploads").getPublicUrl(path);
    return NextResponse.json({ url: data?.publicUrl || "", path });
  } catch (e) {
    return apiErrorResponse(e);
  }
}
