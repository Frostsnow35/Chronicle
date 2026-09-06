"use client";

import React, { useEffect, useState } from "react";
import {
  Link as LinkIcon,
  KeyRound,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink
} from "lucide-react";
import PairWizard from "./PairWizard";
import ManualConfig from "./ManualConfig";
import { Profile, getProfile } from "@/lib/storage";

type Tab = "pair" | "manual";

/** 配对成功后自动关闭本页的等待时长（毫秒）。 */
const CLOSE_DELAY_MS = 1000;

export default function OptionsApp() {
  const [tab, setTab] = useState<Tab>("pair");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [justPaired, setJustPaired] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  // 配对成功后短暂停留，然后自动关闭设置页标签，回到用户原来的浏览上下文。
  useEffect(() => {
    if (!justPaired) return;
    const timer = setTimeout(() => window.close(), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [justPaired]);

  const handlePaired = (p: Profile) => {
    setProfile(p);
    setJustPaired(true);
  };

  if (justPaired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hermes-orange-50/70 via-white to-sky-blue-50/70 px-6 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-glass-lg backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink-950">
            配对成功
          </h1>
          <p className="mt-3 break-all text-sm text-ink-600">
            已连接到
            <span className="font-medium text-ink-800">{profile?.siteUrl}</span>
          </p>
          <p className="mt-4 text-xs text-ink-400">本页即将自动关闭…</p>
          <button
            type="button"
            onClick={() => window.close()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-5 py-2.5 text-sm font-medium text-ink-700 shadow-glass transition hover:bg-white"
          >
            <X className="h-4 w-4" />
            立即关闭本页
          </button>
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-ink-400">
            <ExternalLink className="h-3 w-3" />
            若没有自动关闭，直接关闭此标签页即可，不影响使用。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hermes-orange-50/70 via-white to-sky-blue-50/70 py-12 font-sans">
      <div className="mx-auto w-full max-w-3xl px-6">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hermes-orange-500 to-sky-blue-500 shadow-glass-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink-950">
            Chronicle · 插件配置
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            把浏览器插件连接到你自己部署的站点，所有笔记都保存在你的数据库中。
          </p>
          {profile?.siteUrl && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs text-emerald-700 backdrop-blur">
              <CheckCircle2 className="h-3.5 w-3.5" />
              当前已连接：
              <span className="font-medium">{profile.siteUrl}</span>
            </div>
          )}
        </header>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-full border border-white/70 bg-white/70 p-1 backdrop-blur">
            <TabButton
              active={tab === "pair"}
              onClick={() => setTab("pair")}
              icon={<LinkIcon className="h-4 w-4" />}
              label="一键短链接配对（推荐）"
            />
            <TabButton
              active={tab === "manual"}
              onClick={() => setTab("manual")}
              icon={<KeyRound className="h-4 w-4" />}
              label="手动配置 API Token"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/75 p-8 shadow-glass-lg backdrop-blur-2xl">
          {tab === "pair" ? (
            <PairWizard onPaired={handlePaired} />
          ) : (
            <ManualConfig onSaved={handlePaired} />
          )}
        </div>

        <footer className="mt-10 text-center text-xs text-ink-400">
          所有数据仅保存在你的浏览器本地（chrome.storage.local）和你的私有站点数据库中。
        </footer>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-gradient-to-r from-hermes-orange-500 to-sky-blue-500 text-white shadow-glass"
          : "text-ink-600 hover:text-ink-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
