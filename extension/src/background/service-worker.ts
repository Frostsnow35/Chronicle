/// <reference types="chrome" />

import { syncPendingNote } from "@/lib/api-client";
import type { NotePayload } from "@/lib/api-client";

const ALARM_RETRY = "minimal-notes-retry-notes";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_RETRY, { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_RETRY) return;
  await retryPendingNotes();
});

interface PendingNote {
  id: string;
  payload: NotePayload;
  profile: { siteUrl: string; apiToken: string };
  createdAt: number;
  attempts: number;
}

const KEY_PENDING = "pending_notes";

async function retryPendingNotes() {
  const list: PendingNote[] = await new Promise((resolve) =>
    chrome.storage.local.get([KEY_PENDING], (res) => resolve((res as any)[KEY_PENDING] || []))
  );
  if (list.length === 0) return;

  const stillPending: PendingNote[] = [];
  for (const item of list) {
    if (Date.now() - item.createdAt > 1000 * 60 * 60 * 48) continue;
    try {
      // 重试时重新上传 base64 图片再保存，确保库里不落 base64
      await syncPendingNote(item.profile, item.payload);
    } catch {
      item.attempts += 1;
      if (item.attempts < 12) stillPending.push(item);
    }
  }
  await new Promise<void>((resolve) =>
    chrome.storage.local.set({ [KEY_PENDING]: stillPending }, () => resolve())
  );
}

export {};
