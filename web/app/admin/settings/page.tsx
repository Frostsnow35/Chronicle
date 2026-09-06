"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Loader2, LogOut, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  display_name: string;
  avatar_url: string;
  email: string;
  has_password: boolean;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<ProfileData>({
    display_name: "",
    avatar_url: "",
    email: "",
    has_password: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.email) setForm(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name,
          avatar_url: form.avatar_url
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "保存失败");
      }
      setMsg("设置已保存。");
    } catch (e: any) {
      setErr(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    setUploading(true);
    setErr(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("读取图片失败"));
        reader.readAsDataURL(f);
      });
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl })
      });
      if (!res.ok) throw new Error("上传头像失败");
      const d = await res.json();
      if (!d?.url) throw new Error("上传头像失败");
      setForm((prev) => ({ ...prev, avatar_url: d.url }));
    } catch (e2: any) {
      setErr(e2?.message || "上传头像失败");
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    setPwdMsg(null);
    if (pwd.length < 6) {
      setPwdMsg("新密码至少 6 位。");
      return;
    }
    if (pwd !== pwd2) {
      setPwdMsg("两次输入的密码不一致。");
      return;
    }
    setPwdBusy(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "修改失败");
      setPwd("");
      setPwd2("");
      setPwdMsg("密码已更新。");
    } catch (e: any) {
      setPwdMsg(e?.message || "修改失败");
    } finally {
      setPwdBusy(false);
    }
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-hermes-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <MetaText>Account</MetaText>
        <SerifHeading level={2} className="mt-2">
          用户设置
        </SerifHeading>
        <p className="mt-2 text-sm text-ink-600">
          管理你的作者头像、昵称与账号安全。
        </p>
      </div>

      <GlassCard className="space-y-5 p-6 md:p-8">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/80 shadow-inner"
            aria-label="更换头像"
          >
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="头像"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-6 w-6 text-ink-400" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onAvatarFile}
          />
          <div>
            <p className="text-sm font-medium text-ink-800">头像</p>
            <p className="mt-1 text-xs text-ink-500">
              {uploading ? "上传中…" : "点击圆形区域上传新头像"}
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-800">昵称 / 显示名</span>
          <input
            value={form.display_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, display_name: e.target.value }))
            }
            placeholder="用于文章页的作者署名"
            maxLength={40}
            className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
          />
          <span className="mt-1 block text-xs text-ink-500">
            这个昵称会显示在文章页顶部的作者署名处。
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-800">邮箱（只读）</span>
          <input
            value={form.email}
            readOnly
            className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-500 shadow-inner outline-none"
          />
          <span className="mt-1 block text-xs text-ink-500">
            邮箱用于登录，如需更换请在 Supabase 控制台处理。
          </span>
        </label>

        {msg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
            {msg}
          </div>
        )}
        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {err}
          </div>
        )}

        <div className="flex justify-end border-t border-white/60 pt-5">
          <button onClick={save} disabled={saving || uploading} className="glass-button-primary">
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存设置"}
          </button>
        </div>
      </GlassCard>

      {form.has_password && (
        <GlassCard className="space-y-4 p-6 md:p-8">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-hermes-orange-500" />
            <h3 className="font-serif text-xl font-semibold text-ink-950">修改密码</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-800">新密码</span>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="至少 6 位"
                className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-800">确认新密码</span>
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="再次输入"
                className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
              />
            </label>
          </div>
          {pwdMsg && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                pwdMsg === "密码已更新。"
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                  : "border-red-200 bg-red-50/80 text-red-800"
              }`}
            >
              {pwdMsg}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={changePassword} disabled={pwdBusy} className="glass-button-primary">
              <KeyRound className="h-4 w-4" />
              {pwdBusy ? "处理中…" : "更新密码"}
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-6 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold text-ink-950">退出登录</h3>
            <p className="mt-1 text-sm text-ink-600">退出后需要重新登录才能进入写作后台。</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
