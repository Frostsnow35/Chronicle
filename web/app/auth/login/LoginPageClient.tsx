"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Github, Mail, KeyRound, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPageClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          }
        });
        if (error) throw error;
        setMsg("注册请求已发送。请检查邮箱中的确认链接完成注册，然后登录。");
      }
    } catch (e: any) {
      setErr(e?.message || "操作失败。");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "github" | "google") => {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message || "第三方登录失败。");
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
          <SerifHeading level={2}>作者入口</SerifHeading>
          <p className="mt-2 text-sm text-ink-600">
            {mode === "login"
              ? "欢迎回来，登录后即可进入写作后台。"
              : "创建一个作者账号，开启你的极简文字空间。"}
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-full border border-white/60 bg-white/60 p-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                mode === "login"
                  ? "bg-gradient-to-r from-hermes-orange-500 to-sky-blue-500 text-white shadow-glass"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                mode === "register"
                  ? "bg-gradient-to-r from-hermes-orange-500 to-sky-blue-500 text-white shadow-glass"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              注册
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              <Mail className="h-3.5 w-3.5" /> 邮箱
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none placeholder:text-ink-400 focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              <KeyRound className="h-3.5 w-3.5" /> 密码
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
              placeholder={mode === "register" ? "至少 6 位" : "你的密码"}
            />
          </label>

          <Button variant="primary" size="lg" className="w-full" disabled={busy}>
            {busy ? "处理中…" : mode === "login" ? "登录" : "创建账号"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
          <span className="text-xs text-ink-400">或使用第三方登录</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="default" disabled={busy} onClick={() => oauth("github")}>
            <Github className="h-4 w-4" /> GitHub
          </Button>
          <Button variant="default" disabled={busy} onClick={() => oauth("google")}>
            <Mail className="h-4 w-4" /> Google
          </Button>
        </div>

        {msg && (
          <div className="mt-6 rounded-2xl border border-sky-blue-200 bg-sky-blue-50/80 p-4 text-sm text-sky-blue-800">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {err}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-ink-500">
          <Link href="/" className="hover:text-ink-800">
            ← 返回首页
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
