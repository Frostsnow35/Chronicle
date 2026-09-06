"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import Button from "@/components/ui/Button";
import { isValidUsername, normalizeUsername } from "@/lib/utils";

export default function UsernamePageClient() {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setErr("用户名需为 3–30 位，仅含小写字母、数字、连字符或下划线，并以字母或数字开头。");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "设置失败。");
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || "设置失败。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <GlassCard className="w-full max-w-md p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hermes-orange-500 to-sky-blue-500 shadow-glass-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <SerifHeading level={2}>设置你的空间地址</SerifHeading>
          <p className="mt-2 text-sm text-ink-600">
            你的文字将发布在 <span className="font-mono">yoursite.com/@用户名</span>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              用户名
            </span>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none placeholder:text-ink-400 focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
              placeholder="如 alice 或 alice_writer"
            />
          </label>

          <Button variant="primary" size="lg" className="w-full" disabled={busy}>
            {busy ? "设置中…" : "保存并进入"}
          </Button>
        </form>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {err}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
