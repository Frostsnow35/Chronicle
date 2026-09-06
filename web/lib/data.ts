import { getAdminClient } from "@/lib/supabase/admin";
import { supabaseSecretKey } from "@/lib/supabase/env";

export interface SiteSettings {
  name: string;
  tagline: string;
  author: string;
  footer_text: string;
  chrome_web_store_url: string;
}

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  visibility: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  content_html?: string;
  content_json?: any;
  category?: { id: string; name: string } | null;
}

export const DEFAULT_SITE: SiteSettings = {
  name: "Chronicle",
  tagline: "用文字锚定时间",
  author: "",
  footer_text: "为流动的日子留下凭据",
  chrome_web_store_url: ""
};

/**
 * 读取站点信息：
 *  - name / tagline / footer_text 取 settings.site（未配置时用默认值）
 *  - author（作者署名）改用用户在「设置」里填写的昵称，存在 settings.user
 *  - chrome_web_store_url 供「安装插件」页读取
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("key,value")
      .in("key", ["site", "user"]);
    if (error) return DEFAULT_SITE;

    const siteValue = (data?.find((r) => r.key === "site")?.value ?? {}) as Partial<SiteSettings>;
    const userValue = (data?.find((r) => r.key === "user")?.value ?? {}) as {
      display_name?: string;
    };

    return {
      ...DEFAULT_SITE,
      ...siteValue,
      author: typeof userValue.display_name === "string" ? userValue.display_name : DEFAULT_SITE.author
    };
  } catch {
    return DEFAULT_SITE;
  }
}

export async function getPublicPosts(options?: {
  categoryId?: string;
  limit?: number;
}): Promise<PublicPost[]> {
  if (!supabaseSecretKey()) return [];
  try {
    const admin = getAdminClient();
    let query = admin
      .from("posts")
      .select(
        "id,title,slug,excerpt,cover_image,visibility,category_id,created_at,updated_at,category:categories(id,name)"
      )
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (options?.categoryId) query = query.eq("category_id", options.categoryId);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as PublicPost[];
  } catch {
    return [];
  }
}

export async function getPublicPostBySlug(slug: string): Promise<PublicPost | null> {
  if (!supabaseSecretKey()) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("posts")
      .select(
        "id,title,slug,excerpt,cover_image,visibility,category_id,created_at,updated_at,content_html,content_json,category:categories(id,name)"
      )
      .eq("slug", slug)
      .eq("visibility", "public")
      .maybeSingle();
    if (error || !data) return null;
    return data as PublicPost;
  } catch {
    return null;
  }
}

export async function getCategoryWithPosts(categoryId: string) {
  if (!supabaseSecretKey()) {
    return { category: null, posts: [] as PublicPost[] };
  }
  try {
    const admin = getAdminClient();
    const { data: cat } = await admin
      .from("categories")
      .select("id,name,parent_id")
      .eq("id", categoryId)
      .maybeSingle();
    return { category: cat, posts: await getPublicPosts({ categoryId }) };
  } catch {
    return { category: null, posts: [] as PublicPost[] };
  }
}
