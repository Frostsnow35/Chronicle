"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Settings2 } from "lucide-react";
import QuickEditor from "./QuickEditor";
import { getProfile, Profile } from "@/lib/storage";

export default function PopupApp() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex h-[560px] w-[480px] items-center justify-center bg-gradient-to-br from-hermes-orange-50 via-white to-sky-blue-50 font-sans text-sm text-ink-600">
        加载中…
      </div>
    );
  }

  if (!profile || !profile.siteUrl || !profile.apiToken) {
    return (
      <div className="flex h-[560px] w-[480px] flex-col items-center justify-between bg-gradient-to-br from-hermes-orange-50 via-white to-sky-blue-50 p-8 font-sans">
        <div className="mt-6 flex w-full flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hermes-orange-500 to-sky-blue-500 shadow-glass">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink-950">
            Chronicle
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
            还没有连接到你的站点。
            <br />
            先完成配对，之后就能在这里随时记录灵感。
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => chrome.runtime.openOptionsPage()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hermes-orange-500 to-hermes-orange-400 px-5 py-3 text-sm font-medium text-white shadow-glass transition hover:from-hermes-orange-600 hover:to-hermes-orange-500"
          >
            <Settings2 className="h-4 w-4" />
            立即配置插件
          </button>
          <p className="text-center text-xs text-ink-500">
            不知道怎么操作？访问你的站点后台 → 插件配对，生成配对链接。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[560px] w-[480px] overflow-hidden bg-gradient-to-br from-hermes-orange-50/70 via-white to-sky-blue-50/70 font-sans">
      <QuickEditor profile={profile} />
    </div>
  );
}
