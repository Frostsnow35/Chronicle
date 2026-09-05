export interface Profile {
  siteUrl: string;
  apiToken: string;
  pairedAt?: number;
}

export interface Draft {
  html: string;
  json: any;
  updatedAt: number;
}

const KEY_PROFILE = "profile";
const KEY_DRAFT = "draft";

export function getProfile(): Promise<Profile | null> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([KEY_PROFILE], (res) => {
        resolve((res[KEY_PROFILE] as Profile) || null);
      });
    } catch {
      resolve(null);
    }
  });
}

export function saveProfile(p: Profile): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [KEY_PROFILE]: p }, () => resolve());
    } catch (e) {
      reject(e);
    }
  });
}

export function clearProfile(): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove([KEY_PROFILE], () => resolve());
    } catch {
      resolve();
    }
  });
}

export function getDraft(): Promise<Draft | null> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([KEY_DRAFT], (res) => {
        resolve((res[KEY_DRAFT] as Draft) || null);
      });
    } catch {
      resolve(null);
    }
  });
}

export function saveDraft(d: Draft): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [KEY_DRAFT]: d }, () => resolve());
    } catch (e) {
      reject(e);
    }
  });
}

export function clearDraft(): Promise<void> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove([KEY_DRAFT], () => resolve());
    } catch {
      resolve();
    }
  });
}

export async function testConnection(p: Profile): Promise<boolean> {
  try {
    const res = await fetch(`${p.siteUrl.replace(/\/$/, "")}/api/notes?limit=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${p.apiToken}`,
        "Content-Type": "application/json"
      }
    });
    return res.status === 200 || res.status === 404 || res.status === 204;
  } catch {
    return false;
  }
}
