"use client";

import React, { useState } from "react";
import { Globe, Key, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { Profile, saveProfile, testConnection } from "@/lib/storage";

interface Props {
  onSaved: (p: Profile) => void;
}

export default function ManualConfig({ onSaved }: Props) {
  const [siteUrl, setSiteUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    const normalizedUrl = siteUrl.trim().replace(/\/$/, "");
    if (!/^https?:\/\/.+/.test(normalizedUrl)) {
      setStatus("err");
      setMsg("请填写完整的 http(s) 域名。");
      return;
    }
    if (!apiToken.trim()) {
      setStatus("err");
      setMsg("请填写 API Token。");
      return;
    }
    const p: Profile = {
      siteUrl: normalizedUrl,
      apiToken: apiToken.trim(),
      pairedAt: Date.now()
    };
    setTesting(true);
    setStatus("idle");
    try {
      const ok = await testConnection(p);
      if (!ok) throw new Error("连接失败，请确认域名和 Token。");
      await saveProfile(p);
      onSaved(p);
      setStatus("ok");
      setMsg("连接成功，配置已保存。");
    } catch (e: any) {
      setStatus("err");
      setMsg(e?.message || "无法连接到站点。");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-ink-950">手动配置</h2>
        <p className="mt-1 text-sm text-ink-600">
          在你的站点后台「插件配对」页面的「手动 Token 管理」里创建一个 Token，填到下方即可。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
            <Globe className="h-3.5 w-3.5" /> 你的站点域名
          </label>
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://my-notes.vercel.app"
            className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
            <Key className="h-3.5 w-3.5" /> API Token
          </label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="mntok_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 font-mono text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-blue-500 to-sky-blue-400 px-5 py-2.5 text-sm font-medium text-white shadow-glass transition hover:from-sky-blue-600 hover:to-sky-blue-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {testing ? "测试连接中…" : "测试连接并保存"}
        </button>
      </div>

      {status === "ok" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold">已保存</p>
              <p className="mt-1">{msg}</p>
            </div>
          </div>
        </div>
      )}
      {status === "err" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold">配置失败</p>
              <p className="mt-1">{msg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
