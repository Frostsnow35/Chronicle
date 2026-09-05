import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { randomToken } from "./utils";
import crypto from "node:crypto";

const TOKEN_PREFIX = "mntok_";
const OWNER_CACHE = new Map<string, string>();

/**
 * 在鉴权接口里复用：
 * 1. 优先取 Supabase Session（Web 作者后台），返回 author_id=uid。
 * 2. 其次验证 Authorization: Bearer <token>，查 api_tokens 表，返回 author_id。
 * 3. 未认证抛错，由调用方返回 401。
 */
export async function resolveAuthorFromRequest(
  req: NextRequest
): Promise<{ authorId: string; authKind: "session" | "bearer" }> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) return { authorId: user.id, authKind: "session" };

  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const raw = auth.slice("Bearer ".length).trim();
    const authorId = await resolveApiToken(raw);
    if (authorId) return { authorId, authKind: "bearer" };
  }

  throw Object.assign(new Error("Unauthorized"), { status: 401 });
}

export async function resolveApiToken(raw: string): Promise<string | null> {
  if (!raw) return null;
  const hash = sha256(raw);
  const cached = OWNER_CACHE.get(hash) || null;
  if (cached) return cached;

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("api_tokens")
    .select("owner_id, expires_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // 更新 last_used_at（异步即可）
  admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", hash)
    .then(() => {});

  OWNER_CACHE.set(hash, data.owner_id);
  if (OWNER_CACHE.size > 1000) {
    const firstKey = OWNER_CACHE.keys().next().value;
    if (firstKey) OWNER_CACHE.delete(firstKey);
  }
  return data.owner_id;
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** 生成一个新的 API Token，保存哈希，返回明文（只返回一次）。 */
export async function issueApiToken(
  ownerId: string,
  name = "插件 Token",
  expiresAt?: Date
): Promise<{ token: string; id: string }> {
  const admin = getAdminClient();
  const raw = TOKEN_PREFIX + randomToken(32);
  const hash = sha256(raw);
  const { data, error } = await admin
    .from("api_tokens")
    .insert({
      token_hash: hash,
      name,
      owner_id: ownerId,
      expires_at: expiresAt?.toISOString() ?? null
    })
    .select("id")
    .single();
  if (error || !data) {
    throw Object.assign(new Error("无法创建 Token：" + (error?.message ?? "")), {
      status: 500
    });
  }
  return { token: raw, id: data.id };
}

/**
 * 读取 /api/** 请求体的安全助手，兼容 Edge Runtime。
 */
export async function readJsonBody<T = any>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw Object.assign(new Error("请求体必须是合法 JSON"), { status: 400 });
  }
}

export function apiErrorResponse(error: unknown) {
  const err = error as any;
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message || "Internal Server Error";
  return NextResponse.json({ error: message }, { status });
}
