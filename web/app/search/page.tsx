"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import PostCard from "@/components/PostCard";
import MetaText from "@/components/ui/MetaText";
import SerifHeading from "@/components/ui/SerifHeading";
import type { PublicPost } from "@/lib/data";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicPost[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const keyword = q.trim();
    if (!keyword) {
      setLoading(false);
      setResults(null);
      return;
    }
    setLoading(true);
    timerRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
        const d = await r.json();
        setResults(d.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href="/" className="link-muted font-sans text-sm">
        ← 返回首页
      </Link>

      <header className="mb-10 mt-10">
        <MetaText>Search</MetaText>
        <SerifHeading level={2} className="mt-2">
          搜索
        </SerifHeading>
      </header>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题、摘要或正文…"
          className="w-full rounded-2xl border border-white/60 bg-white/70 py-3 pl-12 pr-4 text-ink-800 shadow-glass backdrop-blur outline-none placeholder:text-ink-400 focus:border-hermes-orange-300"
        />
      </div>

      <div className="mt-10">
        {results === null ? (
          <p className="py-16 text-center text-ink-500">输入关键词开始搜索。</p>
        ) : loading ? (
          <p className="py-16 text-center text-ink-500">搜索中…</p>
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-ink-500">没有找到相关文章。</p>
        ) : (
          <div className="space-y-8">
            {results.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
