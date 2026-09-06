import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileByUsername } from "@/lib/data";

export const runtime = "nodejs";

/**
 * 站内全文搜索接口：
 *  - 可选 username 参数，限定在某个用户空间内搜索
 *  - 仅返回公开文章，匹配标题、摘要与正文
 *  - 使用 ilike 子串匹配，中文搜索无需分词
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const username = (url.searchParams.get("username") || "").trim();
    if (!q) return NextResponse.json({ data: [] });

    // 转义 ilike 通配符，避免 % _ \ 被当作模式语法
    const escaped = q.replace(/[\\%_]/g, (m) => `\\${m}`);
    const pattern = `%${escaped}%`;

    const admin = getAdminClient();
    let query = admin
      .from("posts")
      .select(
        "id,title,slug,excerpt,cover_image,visibility,category_id,created_at,updated_at,category:categories(id,name)"
      )
      .eq("visibility", "public");

    if (username) {
      const profile = await getProfileByUsername(username);
      if (!profile) return NextResponse.json({ data: [] });
      query = query.eq("author_id", profile.id);
    }

    query = query
      .or(
        `title.ilike.${pattern},excerpt.ilike.${pattern},content_html.ilike.${pattern}`
      )
      .order("created_at", { ascending: false })
      .limit(30);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
