import { getAdminClient } from "@/lib/supabase/admin";
import { supabaseSecretKey } from "@/lib/supabase/env";

export interface GlobalSiteSettings {
  name: string;
  tagline: string;
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

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  theme: string;
}

export interface SpaceInfo extends Profile {
  post_count: number;
}

export const DEFAULT_SITE: GlobalSiteSettings = {
  name: "Chronicle",
  tagline: "用文字锚定时间",
  footer_text: "为流动的日子留下凭据",
  chrome_web_store_url: ""
};

/**
 * 读取全局站点信息（全局首页品牌 + 插件商店地址）。
 * 多租户下每个用户空间的外观/昵称见 profiles 表，此处只读全局 site 键。
 */
export async function getGlobalSiteSettings(): Promise<GlobalSiteSettings> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();
    if (error || !data) return DEFAULT_SITE;
    const siteValue = (data.value ?? {}) as Partial<GlobalSiteSettings>;
    return { ...DEFAULT_SITE, ...siteValue };
  } catch {
    return DEFAULT_SITE;
  }
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!supabaseSecretKey()) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,display_name,avatar_url,bio,theme")
      .eq("username", username.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  if (!supabaseSecretKey()) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,display_name,avatar_url,bio,theme")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

/** 列出至少发布过 1 篇公开文章的空间，供全局首页展示。 */
export async function listSpaces(): Promise<SpaceInfo[]> {
  if (!supabaseSecretKey()) return [];
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,display_name,avatar_url,bio,theme")
      .order("created_at", { ascending: true });
    if (error || !data) return [];

    const { data: counts } = await admin
      .from("posts")
      .select("author_id")
      .eq("visibility", "public");
    const countMap = new Map<string, number>();
    for (const p of counts ?? []) {
      countMap.set(p.author_id, (countMap.get(p.author_id) ?? 0) + 1);
    }

    return (data as Profile[])
      .map((p) => ({ ...p, post_count: countMap.get(p.id) ?? 0 }))
      .filter((p) => p.post_count > 0);
  } catch {
    return [];
  }
}

export async function getSpacePosts(
  username: string,
  options?: { categoryId?: string; limit?: number }
): Promise<PublicPost[]> {
  const profile = await getProfileByUsername(username);
  if (!profile) return [];
  try {
    const admin = getAdminClient();
    let query = admin
      .from("posts")
      .select(
        "id,title,slug,excerpt,cover_image,visibility,category_id,created_at,updated_at,category:categories(id,name)"
      )
      .eq("author_id", profile.id)
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

export async function getSpacePostBySlug(
  username: string,
  slug: string
): Promise<PublicPost | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("posts")
      .select(
        "id,title,slug,excerpt,cover_image,visibility,category_id,created_at,updated_at,content_html,content_json,category:categories(id,name)"
      )
      .eq("author_id", profile.id)
      .eq("slug", slug)
      .eq("visibility", "public")
      .maybeSingle();
    if (error || !data) return null;
    return data as PublicPost;
  } catch {
    return null;
  }
}

export interface SpaceCategory {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export async function getSpaceCategories(username: string): Promise<SpaceCategory[]> {
  const profile = await getProfileByUsername(username);
  if (!profile) return [];
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("categories")
      .select("id,name,parent_id,sort_order,created_at")
      .eq("author_id", profile.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as SpaceCategory[];
  } catch {
    return [];
  }
}

export async function getSpaceCategoryWithPosts(
  username: string,
  categoryId: string
): Promise<{ category: SpaceCategory | null; posts: PublicPost[] }> {
  const profile = await getProfileByUsername(username);
  if (!profile) return { category: null, posts: [] as PublicPost[] };
  try {
    const admin = getAdminClient();
    const { data: cat } = await admin
      .from("categories")
      .select("id,name,parent_id,sort_order,created_at")
      .eq("id", categoryId)
      .eq("author_id", profile.id)
      .maybeSingle();
    return {
      category: (cat as SpaceCategory | null) ?? null,
      posts: await getSpacePosts(username, { categoryId })
    };
  } catch {
    return { category: null, posts: [] as PublicPost[] };
  }
}
