/// <reference types="chrome" />

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
  payload: any;
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
      const r = await fetch(`${item.profile.siteUrl.replace(/\/$/, "")}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${item.profile.apiToken}`
        },
        body: JSON.stringify(item.payload)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
