"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Link2,
  Copy,
  Check,
  KeyRound,
  Plus,
  Trash2,
  Clock,
  RefreshCw
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";

interface ApiTokenMeta {
  id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function AdminPairingPage() {
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tokens, setTokens] = useState<ApiTokenMeta[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/pairing", { cache: "no-store" });
    const data = await res.json();
    setTokens(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const generate = async () => {
    setGenerating(true);
    setErr(null);
    setShortLink(null);
    setNewToken(null);
    try {
      const res = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "生成失败");
      setShortLink(data.shortLink);
      setExpiresAt(data.expiresAt);
    } catch (e: any) {
      setErr(e?.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!shortLink) return;
    await navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const issueToken = async () => {
    setIssuing(true);
    setErr(null);
    setNewToken(null);
    try {
      const res = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue-token", name: newTokenName || "自定义 Token" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "创建失败");
      setNewToken(data.token);
      setNewTokenName("");
      loadTokens();
    } catch (e: any) {
      setErr(e?.message || "创建失败");
    } finally {
      setIssuing(false);
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm("确定吊销这个 Token？使用它的插件将无法再连接。")) return;
    await fetch("/api/pairing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke-token", id })
    });
    loadTokens();
  };

  return (
    <div className="space-y-6">
      <div>
        <MetaText>Extension</MetaText>
        <SerifHeading level={2} className="mt-2">
          插件配对
        </SerifHeading>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          让浏览器插件连接到你的站点。推荐使用「一键短链接配对」，插件粘贴短链接即可自动完成；高级用户也可手动创建长期 Token。
        </p>
      </div>

      {/* 一键配对 */}
      <GlassCard className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-hermes-orange-500" />
          <h3 className="font-serif text-xl font-semibold text-ink-950">
            一键短链接配对（推荐）
          </h3>
        </div>
        <p className="mb-5 text-sm text-ink-600">
          生成一个 180 秒有效的配对短链接，复制到插件「设置 → 一键配对」粘贴即可自动完成连接。
        </p>

        {!shortLink ? (
          <button onClick={generate} disabled={generating} className="glass-button-primary">
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> 生成中…
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" /> 生成配对链接
              </>
            )}
          </button>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <Clock className="h-3.5 w-3.5" />
              链接有效至 {expiresAt ? new Date(expiresAt).toLocaleString("zh-CN", { hour12: false }) : ""}（180 秒内使用）
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-xl bg-white/80 px-4 py-3 font-mono text-xs text-ink-800 border border-white/60">
                {shortLink}
              </code>
              <button
                onClick={copy}
                className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/80 border border-white/60 text-ink-700 transition hover:bg-white"
                aria-label="复制"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={generate}
              className="mt-3 text-xs text-ink-500 hover:text-ink-800"
            >
              ← 重新生成
            </button>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white/50 p-4 text-xs leading-relaxed text-ink-600">
          <p className="font-semibold text-ink-800">插件侧操作步骤：</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>点击浏览器工具栏的「极简笔记」图标</li>
            <li>首次使用会提示「立即配置插件」，点击进入设置页</li>
            <li>选择「一键短链接配对」，粘贴上面的链接，点击「开始配对」</li>
          </ol>
        </div>
      </GlassCard>

      {/* 手动 Token */}
      <GlassCard className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-sky-blue-600" />
          <h3 className="font-serif text-xl font-semibold text-ink-950">
            手动 Token 管理
          </h3>
        </div>
        <p className="mb-5 text-sm text-ink-600">
          适用于无法使用短链接配对的场景。创建后把 Token 填入插件的「手动配置」。
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            placeholder="Token 名称（如：我的 Chrome）"
            className="flex-1 rounded-2xl border border-ink-200 bg-white/80 px-4 py-2.5 text-sm shadow-inner outline-none placeholder:text-ink-400 focus:border-sky-blue-400 focus:ring-2 focus:ring-sky-blue-200"
          />
          <button onClick={issueToken} disabled={issuing} className="glass-button-accent">
            <Plus className="h-4 w-4" /> {issuing ? "创建中…" : "创建 Token"}
          </button>
        </div>

        {newToken && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
            <p className="mb-2 text-xs font-semibold text-amber-800">
              请立即复制并妥善保存，此 Token 仅显示一次：
            </p>
            <code className="block break-all rounded-xl bg-white/80 px-4 py-3 font-mono text-xs text-ink-800 border border-amber-200">
              {newToken}
            </code>
          </div>
        )}

        <div className="space-y-2">
          {tokens.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">暂无 Token。</p>
          ) : (
            tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/60 px-4 py-3"
              >
                <KeyRound className="h-4 w-4 flex-none text-sky-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {t.name || "未命名 Token"}
                  </p>
                  <p className="text-xs text-ink-500">
                    创建于 {new Date(t.created_at).toLocaleString("zh-CN", { hour12: false })}
                    {t.last_used_at && ` · 上次使用 ${new Date(t.last_used_at).toLocaleString("zh-CN", { hour12: false })}`}
                  </p>
                </div>
                <button
                  onClick={() => revokeToken(t.id)}
                  className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-red-600"
                  aria-label="吊销"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          {err}
        </div>
      )}
    </div>
  );
}
