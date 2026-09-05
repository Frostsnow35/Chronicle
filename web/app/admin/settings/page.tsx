"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";

interface SiteSettings {
  name: string;
  tagline: string;
  author: string;
  footer_text: string;
  chrome_web_store_url: string;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettings>({
    name: "",
    tagline: "",
    author: "",
    footer_text: "",
    chrome_web_store_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.value) setForm(d.value);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("保存失败");
      setMsg("设置已保存。");
    } catch (e: any) {
      setMsg(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const update = (k: keyof SiteSettings, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-hermes-orange-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <MetaText>Site</MetaText>
        <SerifHeading level={2} className="mt-2">
          站点设置
        </SerifHeading>
      </div>

      <GlassCard className="space-y-5 p-6 md:p-8">
        <Field
          label="站点名称"
          hint="显示在首页封面和浏览器标签页"
          value={form.name}
          onChange={(v) => update("name", v)}
        />
        <Field
          label="一句话简介"
          hint="显示在首页封面，介绍你的站点"
          value={form.tagline}
          onChange={(v) => update("tagline", v)}
        />
        <Field
          label="作者署名"
          hint="显示在文章和页脚"
          value={form.author}
          onChange={(v) => update("author", v)}
        />
        <Field
          label="页脚文字"
          hint="显示在页面底部"
          value={form.footer_text}
          onChange={(v) => update("footer_text", v)}
        />
        <Field
          label="插件商店地址（Edge 应用商店）"
          hint="上架插件后填这里，让后台「安装插件」按钮可一键跳转；例如 https://microsoftedge.microsoft.com/addons/detail/xxxx"
          value={form.chrome_web_store_url}
          onChange={(v) => update("chrome_web_store_url", v)}
        />

        {msg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
            {msg}
          </div>
        )}

        <div className="flex justify-end border-t border-white/60 pt-5">
          <button onClick={save} disabled={saving} className="glass-button-primary">
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存设置"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm shadow-inner outline-none focus:border-hermes-orange-400 focus:ring-2 focus:ring-hermes-orange-200"
      />
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}
