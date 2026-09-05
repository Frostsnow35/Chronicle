"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Lock, Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MetaText from "@/components/ui/MetaText";
import TiptapEditor from "@/components/Editor/TiptapEditor";
import type { Editor } from "@tiptap/react";
import type { CategoryRaw } from "@/lib/utils";

interface EditorClientProps {
  postId?: string;
  noteId?: string;
}

export default function EditorClient({ postId, noteId }: EditorClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<CategoryRaw[]>([]);
  const [content, setContent] = useState<{ html: string; json: any }>({
    html: "",
    json: {}
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!postId || !!noteId);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("加载文章失败");
        const p = await res.json();
        setTitle(p.title || "");
        setVisibility(p.visibility || "public");
        setCategoryId(p.category_id || "");
        setContent({ html: p.content_html || "", json: p.content_json || {} });
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("加载速记失败");
        const n = await res.json();
        setContent({ html: n.content_html || "", json: n.content_json || {} });
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId]);

  const handleSave = async (publish = true) => {
    if (!title.trim()) {
      setError("请先填写文章标题。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        content_html: content.html,
        content_json: content.json,
        visibility,
        category_id: categoryId || null
      };
      const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
        method: postId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "保存失败");
      // 从速记转为文章：内容已写入文章，删除原速记
      if (!postId && noteId) {
        await fetch(`/api/notes/${noteId}`, { method: "DELETE" }).catch(
          () => {}
        );
      }
      if (!postId) {
        router.replace(`/admin/editor/${json.id}`);
      }
      if (publish && visibility === "public") {
        router.replace("/admin");
      }
    } catch (e: any) {
      setError(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" /> 返回列表
        </Link>
        <MetaText>{postId ? "编辑文章" : "新建文章"}</MetaText>
      </div>

      <GlassCard className="space-y-5 p-6 md:p-8">
        {/* 标题 */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={1}
          placeholder="文章标题…"
          className="w-full resize-none bg-transparent font-serif text-3xl md:text-4xl font-semibold text-ink-950 outline-none placeholder:text-ink-300"
        />

        {/* 元信息工具栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-white/60 bg-white/60 p-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                visibility === "public"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-glass"
                  : "text-ink-600"
              }`}
            >
              <Globe className="h-3.5 w-3.5" /> 公开
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                visibility === "private"
                  ? "bg-gradient-to-r from-ink-700 to-ink-600 text-white shadow-glass"
                  : "text-ink-600"
              }`}
            >
              <Lock className="h-3.5 w-3.5" /> 私密
            </button>
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-full border border-white/60 bg-white/60 px-3 py-2 text-sm text-ink-700 outline-none backdrop-blur focus:border-hermes-orange-400"
          >
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 编辑器 */}
        <TiptapEditor
          value={content}
          onChange={(c) => setContent(c)}
          onReady={(e) => (editorRef.current = e)}
          minHeight={420}
          placeholder="开始书写你的文字…"
        />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-3 border-t border-white/60 pt-5">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="glass-button text-ink-800"
          >
            保存草稿
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="glass-button-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 保存中…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {visibility === "public" ? "发布" : "保存"}
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
