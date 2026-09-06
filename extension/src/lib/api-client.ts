import { Profile } from "./storage";

export interface NotePayload {
  content_html: string;
  content_json: any;
  source_url?: string;
  images?: string[];
}

export interface NoteResult {
  id: string;
  created_at: string;
}

const KEY_PENDING = "pending_notes";
const REQUEST_TIMEOUT = 15000;

function headers(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

/** 带超时的 fetch，避免网络不稳时长时间挂起。 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function saveNote(p: Profile, payload: NotePayload): Promise<NoteResult> {
  try {
    return await syncPendingNote(p, payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!msg.startsWith("授权失效")) {
      await enqueuePendingNote(p, payload);
    }
    throw e;
  }
}

/**
 * 核心保存逻辑：先把 base64 图片上传到站点存储，再保存正文。
 * 失败时抛错，不自行入队。供 popup 与 service-worker 重试共用。
 */
export async function syncPendingNote(
  p: Profile,
  payload: NotePayload
): Promise<NoteResult> {
  const base = p.siteUrl.replace(/\/$/, "");
  const { html, images } = await inlineImagesToStorage(
    base,
    p.apiToken,
    payload.content_html
  );
  const body = { ...payload, content_html: html, images };
  const r = await fetchWithTimeout(`${base}/api/notes`, {
    method: "POST",
    headers: headers(p.apiToken),
    body: JSON.stringify(body)
  });
  if (r.ok) return r.json() as Promise<NoteResult>;
  if (r.status === 401) {
    throw new Error("授权失效，请在插件设置中重新配对。");
  }
  throw new Error(`保存失败 (HTTP ${r.status})`);
}

export async function exchangePairingToken(
  siteUrl: string,
  pairingToken: string
): Promise<{ apiToken: string }> {
  const base = siteUrl.replace(/\/$/, "");
  const r = await fetchWithTimeout(`${base}/api/pairing/exchange`, {
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
): Promise<{ html: string; images: string[] }> {
  // 用正则而非 DOMParser，兼容 service-worker 环境（无 DOM API）
  const dataUrls = new Set<string>();
  const re = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    dataUrls.add(m[0]);
  }
  if (dataUrls.size === 0) return { html, images: [] };

  const map = new Map<string, string>();
  const images: string[] = [];
  for (const dataUrl of dataUrls) {
    const uploaded = await uploadImageBase64(base, token, dataUrl);
    if (!uploaded?.url) {
      // 任一图片上传失败即抛错，由调用方整条入队重试，保证不落 base64
      throw new Error("图片上传失败，稍后将自动重试。");
    }
    map.set(dataUrl, uploaded.url);
    images.push(uploaded.url);
  }

  let result = html;
  for (const [dataUrl, url] of map) {
    result = result.split(dataUrl).join(url);
  }
  return { html: result, images };
}

async function uploadImageBase64(
  base: string,
  token: string,
  dataUrl: string
): Promise<{ url: string } | null> {
  const r = await fetchWithTimeout(`${base}/api/storage/upload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ dataUrl })
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ url: string }>;
}

interface PendingNote {
  id: string;
  payload: NotePayload;
  profile: { siteUrl: string; apiToken: string };
  createdAt: number;
  attempts: number;
}

/** 保存失败时把笔记写入本地队列，由后台定时任务自动重试。 */
async function enqueuePendingNote(p: Profile, payload: NotePayload) {
  const list: PendingNote[] = await new Promise((resolve) =>
    chrome.storage.local.get([KEY_PENDING], (res) =>
      resolve((res[KEY_PENDING] as PendingNote[]) || [])
    )
  );
  const next: PendingNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    profile: { siteUrl: p.siteUrl, apiToken: p.apiToken },
    createdAt: Date.now(),
    attempts: 0
  };
  await new Promise<void>((resolve) =>
    chrome.storage.local.set({ [KEY_PENDING]: [...list, next] }, () => resolve())
  );
}
