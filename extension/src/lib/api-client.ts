import { Profile } from "./storage";

export interface NotePayload {
  content_html: string;
  content_json: any;
  source_url?: string;
}

export interface NoteResult {
  id: string;
  created_at: string;
}

function headers(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function saveNote(p: Profile, payload: NotePayload): Promise<NoteResult> {
  const base = p.siteUrl.replace(/\/$/, "");
  // 1) 上传任意 base64 图片到站点存储（将 <img src="data:.."> 替换为 URL）
  const processedHtml = await inlineImagesToStorage(base, p.apiToken, payload.content_html);
  const body = { ...payload, content_html: processedHtml };
  const r = await fetch(`${base}/api/notes`, {
    method: "POST",
    headers: headers(p.apiToken),
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    if (r.status === 401) throw new Error("授权失效，请在插件设置中重新配对。");
    const text = await r.text().catch(() => "");
    throw new Error(`保存失败 (HTTP ${r.status}) ${text}`);
  }
  return r.json() as Promise<NoteResult>;
}

export async function exchangePairingToken(
  siteUrl: string,
  pairingToken: string
): Promise<{ apiToken: string }> {
  const base = siteUrl.replace(/\/$/, "");
  const r = await fetch(`${base}/api/pairing/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: pairingToken })
  });
  if (!r.ok) {
    if (r.status === 410) throw new Error("配对链接已过期或已使用，请重新生成。");
    throw new Error(`配对失败 (HTTP ${r.status})`);
  }
  return r.json() as Promise<{ apiToken: string }>;
}

async function inlineImagesToStorage(
  base: string,
  token: string,
  html: string
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img"));
  for (const img of imgs) {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("data:image/")) {
      try {
        const uploaded = await uploadImageBase64(base, token, src);
        if (uploaded?.url) img.setAttribute("src", uploaded.url);
      } catch {
        // 上传失败时保留 base64，由数据库兜底存储
      }
    }
  }
  return doc.body.innerHTML;
}

async function uploadImageBase64(
  base: string,
  token: string,
  dataUrl: string
): Promise<{ url: string } | null> {
  const r = await fetch(`${base}/api/storage/upload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ dataUrl })
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ url: string }>;
}
