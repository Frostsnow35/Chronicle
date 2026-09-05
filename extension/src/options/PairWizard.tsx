"use client";

import React, { useState } from "react";
import { Link as LinkIcon, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { exchangePairingToken } from "@/lib/api-client";
import { Profile, saveProfile, testConnection } from "@/lib/storage";

interface Props {
  onPaired: (p: Profile) => void;
}

type Step = "input" | "exchanging" | "success" | "error";

export default function PairWizard({ onPaired }: Props) {
  const [input, setInput] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const handlePair = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setErr("请先粘贴配对短链接。");
      return;
    }
    let siteUrl = "";
    let token = "";
    try {
      // 支持 https://site.example.com/pair?token=xxx 或 /api/pairing/xxx
      if (trimmed.startsWith("http")) {
        const u = new URL(trimmed);
        siteUrl = `${u.protocol}//${u.host}`;
        token = u.searchParams.get("token") || u.pathname.split("/").filter(Boolean).pop() || "";
      } else {
        throw new Error("请输入完整的 http(s) 配对链接。");
      }
      if (!token) throw new Error("链接里没找到配对 token，请重新生成。");
    } catch (e: any) {
      setErr(e.message || "链接格式不正确。");
      setStep("error");
      return;
    }
    setStep("exchanging");
    setErr("");
    try {
      const { apiToken } = await exchangePairingToken(siteUrl, token);
      const p: Profile = { siteUrl, apiToken, pairedAt: Date.now() };
      const ok = await testConnection(p);
      if (!ok) throw new Error("连接测试失败，Token 可能无效。");
      await saveProfile(p);
      setProfile(p);
      onPaired(p);
      setStep("success");
    } catch (e: any) {
      setErr(e?.message || "配对失败，请检查网络或重新生成配对链接。");
      setStep("error");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-ink-950">
          一键短链接配对
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          登录你自己的站点后台 → 插件配对 → 点「生成配对链接」，把完整链接粘贴到下方即可。
        </p>
      </div>

      <ol className="mb-6 space-y-2 text-sm text-ink-600">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-hermes-orange-100 text-xs font-semibold text-hermes-orange-700">
            1
          </span>
          登录你的站点后台，进入「插件配对」页面。
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-hermes-orange-100 text-xs font-semibold text-hermes-orange-700">
            2
          </span>
          点击「生成配对链接」，复制完整的短链接（60 分钟内有效）。
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-hermes-orange-100 text-xs font-semibold text-hermes-orange-700">
            3
          </span>
          粘贴到下方输入框，点击「开始配对」。
        </li>
      </ol>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-500">
        配对链接
      </label>
      <div className="flex items-stretch gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 shadow-inner focus-within:border-hermes-orange-400 focus-within:ring-2 focus-within:ring-hermes-orange-200">
          <LinkIcon className="h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={input}
            placeholder="例如：https://my-notes.vercel.app/pair?token=abc123..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePair()}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            disabled={step === "exchanging"}
          />
        </div>
        <button
          type="button"
          onClick={handlePair}
          disabled={step === "exchanging"}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-hermes-orange-500 to-hermes-orange-400 px-5 text-sm font-medium text-white shadow-glass transition hover:from-hermes-orange-600 hover:to-hermes-orange-500 disabled:opacity-60"
        >
          {step === "exchanging" ? "配对中…" : "开始配对"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {step === "success" && profile && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold">配对成功 🎉</p>
              <p className="mt-1 text-emerald-700/90">
                已连接到 <span className="font-medium">{profile.siteUrl}</span>
                。可以直接关闭本页，点击浏览器工具栏的插件图标开始速记了。
              </p>
            </div>
          </div>
        </div>
      )}

      {(step === "error" || err) && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold">配对失败</p>
              <p className="mt-1">{err || "请检查链接是否正确，或重新生成配对链接再试。"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
