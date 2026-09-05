import { getAdminClient } from "./supabase/admin";
import { issueApiToken, sha256 } from "./auth";
import { randomToken } from "./utils";

export interface PairingPayload {
  owner_id: string;
  expires_at: string;
}

/** 生成一个一次性配对短链接 Token，入库。返回短链接完整 URL。 */
export async function generatePairingLink(ownerId: string): Promise<{
  token: string;
  expiresAt: Date;
  shortLink: string;
}> {
  const token = "pair_" + randomToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 分钟
  const admin = getAdminClient();
  const { error } = await admin.from("pairing_tokens").insert({
    token,
    owner_id: ownerId,
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error("无法生成配对链接：" + error.message);

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("请配置 NEXT_PUBLIC_SITE_URL 环境变量。");

  // 短链接形式：https://site.example.com/pair?token=xxx
  const url = new URL(base);
  url.pathname = "/pair";
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
