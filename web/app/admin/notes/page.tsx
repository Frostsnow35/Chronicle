"use client";

import React, { useEffect, useState } from "react";
import { Trash2, NotebookPen, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import { formatDateTime } from "@/lib/utils";

interface Note {
  id: string;
  content_html: string;
  source_url: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/notes?limit=100", { cache: "no-store" });
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteNote = async (id: string) => {
    if (!confirm("确定删除这条笔记？")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="mb-8">
        <MetaText>Quick Notes</MetaText>
        <SerifHeading level={2} className="mt-2">
          速记笔记
        </SerifHeading>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          这里展示通过浏览器插件保存到本站的速记笔记。
        </p>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink-500">加载中…</p>
      ) : notes.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <NotebookPen className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-4 text-ink-500">
            还没有笔记。安装浏览器插件，浏览网页时随时记录灵感，就会出现在这里。
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <GlassCard key={n.id} className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <MetaText>{formatDateTime(n.created_at)}</MetaText>
                <div className="flex items-center gap-1">
                  {n.source_url && (
                    <a
                      href={n.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-sky-blue-600"
                      aria-label="来源网页"
                      title="来源网页"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-red-600"
                    aria-label="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                className="prose-minimal"
                dangerouslySetInnerHTML={{ __html: n.content_html }}
              />
              {n.images && n.images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {n.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt="笔记图片"
                      className="h-24 w-24 rounded-xl object-cover border border-white/60"
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
