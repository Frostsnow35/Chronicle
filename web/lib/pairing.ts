import { getAdminClient } from "./supabase/admin";
import { issueApiToken, sha256 } from "./auth";
import { randomToken } from "./utils";

export interface PairingPayload {
  owner_id: string;
  expires_at: string;
}

/** 归一化站点域名：自动补全协议头、剥离路径，返回合法的 origin；无法解析时返回空串。 */
function normalizeBase(input: string): string {
  let s = (input || "").trim().replace(/\/+$/, "");
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    return new URL(s).origin;
  } catch {
    return "";
  }
}

/** 生成一个一次性配对短链接 Token，入库。返回短链接完整 URL。 */
export async function generatePairingLink(
  ownerId: string,
  requestOrigin?: string
): Promise<{
  token: string;
  expiresAt: Date;
  shortLink: string;
}> {
  const token = "pair_" + randomToken(32);
  const expiresAt = new Date(Date.now() + 180 * 1000); // 180 秒
  const admin = getAdminClient();
  const { error } = await admin.from("pairing_tokens").insert({
    token,
    owner_id: ownerId,
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error("无法生成配对链接：" + error.message);

  // 优先使用显式配置的站点域名，未配置时回退到请求推导出的 origin
  const base = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || "");
  if (!base) throw new Error("无法确定站点域名，请检查 NEXT_PUBLIC_SITE_URL 配置。");

  // 短链接形式：https://site.example.com/pair?token=xxx
  const url = new URL("/pair", base);
  url.searchParams.set("token", token);
  return { token, expiresAt, shortLink: url.toString() };
}

/** 验证 pairing token，返回 ownerId，并立即标记 consumed；若无效返回 null。 */
export async function consumePairingToken(raw: string): Promise<string | null> {
  const token = raw.trim();
  if (!token) return null;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("pairing_tokens")
    .select("token, owner_id, expires_at, consumed")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (data.consumed) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  const { error: updErr } = await admin
    .from("pairing_tokens")
    .update({ consumed: true, consumed_at: new Date().toISOString() })
    .eq("token", token);
  if (updErr) return null;

  return data.owner_id;
}

/** 插件调用：把 pairing token 换成长效 API Token。 */
export async function exchangePairingForApiToken(
  rawPairingToken: string
): Promise<{ apiToken: string }> {
  // 可能用户传的是整个链接，先兼容解析 query token
  let token = rawPairingToken.trim();
  try {
    if (token.startsWith("http")) {
      const u = new URL(token);
      token = u.searchParams.get("token") || token;
    }
  } catch {}
  // 兼容从 pathname 取 token 的形式
  if (token.startsWith("http")) {
    throw Object.assign(new Error("配对链接格式不正确。"), { status: 400 });
  }
  const ownerId = await consumePairingToken(token);
  if (!ownerId) {
    throw Object.assign(new Error("配对链接已过期、已使用或不存在。"), {
      status: 410
    });
  }
  const { token: apiToken } = await issueApiToken(
    ownerId,
    "浏览器插件 · 一键配对",
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2)
  );
  return { apiToken };
}

export { sha256 };
