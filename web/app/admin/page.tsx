"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutList,
  FolderTree,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import CategoryTree from "@/components/CategoryTree";
import { collectDescendantIds, formatDateTime, type CategoryRaw } from "@/lib/utils";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  visibility: "public" | "private";
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

type View = "timeline" | "tree";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<CategoryRaw[]>([]);
  const [view, setView] = useState<View>("timeline");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/posts?all=1", { cache: "no-store" });
    const json = await res.json();
    setPosts(json.data || []);
    const catRes = await fetch("/api/categories", { cache: "no-store" });
    const catJson = await catRes.json();
    setCategories(Array.isArray(catJson) ? catJson : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return posts;
    const ids = collectDescendantIds(categories, selectedCategory);
    return posts.filter((p) => p.category_id && ids.has(p.category_id));
  }, [posts, selectedCategory, categories]);

  const deletePost = async (id: string) => {
    if (!confirm("确定删除这篇文章？此操作不可恢复。")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    load();
  };

  const grouped = useMemo(() => {
    const map = new Map<string, PostItem[]>();
    for (const p of filtered) {
      const key = p.created_at.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <MetaText>Dashboard</MetaText>
          <SerifHeading level={2} className="mt-2">
            文章管理
          </SerifHeading>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full border border-white/60 bg-white/60 p-1 backdrop-blur">
            <button
              onClick={() => setView("timeline")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                view === "timeline"
                  ? "bg-gradient-to-r from-hermes-orange-500 to-sky-blue-500 text-white shadow-glass"
                  : "text-ink-600"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" /> 时间线
            </button>
            <button
              onClick={() => setView("tree")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                view === "tree"
                  ? "bg-gradient-to-r from-hermes-orange-500 to-sky-blue-500 text-white shadow-glass"
                  : "text-ink-600"
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" /> 分类树
            </button>
          </div>
          <Link
            href="/admin/editor"
            className="glass-button-primary !rounded-full"
          >
            <Plus className="h-4 w-4" /> 写文章
          </Link>
        </div>
      </div>

      {view === "tree" && (
        <GlassCard className="mb-8 p-6">
          <MetaText>按分类浏览</MetaText>
          <div className="mt-4">
            <CategoryTree
              categories={categories}
              selectedId={selectedCategory}
              onSelect={(id) => setSelectedCategory(id)}
              defaultExpandAll
            />
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-3 text-xs text-ink-500 hover:text-ink-800"
            >
              ← 清除分类筛选
            </button>
          )}
        </GlassCard>
      )}

      {loading ? (
        <p className="py-16 text-center text-ink-500">加载中…</p>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="text-ink-500">
            {selectedCategory ? "该分类下还没有文章。" : "还没有文章，开始写第一篇吧。"}
          </p>
          {!selectedCategory && (
            <Link href="/admin/editor" className="mt-4 inline-block">
              <span className="glass-button-primary">写第一篇文章</span>
            </Link>
          )}
        </GlassCard>
      ) : view === "timeline" ? (
        <div className="space-y-10">
          {grouped.map(([month, items]) => (
            <div key={month}>
              <div className="mb-4 flex items-center gap-3">
                <MetaText>{month}</MetaText>
                <span className="h-px flex-1 bg-gradient-to-r from-ink-200/80 to-transparent" />
              </div>
              <div className="space-y-3">
                {items.map((p) => (
                  <PostRow key={p.id} post={p} onDelete={deletePost} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PostRow key={p.id} post={p} onDelete={deletePost} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostRow({
  post,
  onDelete
}: {
  post: PostItem;
  onDelete: (id: string) => void;
}) {
  return (
    <GlassCard className="flex items-center gap-4 p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {post.visibility === "private" ? (
            <EyeOff className="h-3.5 w-3.5 text-ink-400" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <Link
            href={`/admin/editor/${post.id}`}
            className="truncate font-serif text-lg font-medium text-ink-950 hover:text-hermes-orange-700"
          >
            {post.title}
          </Link>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
          <span>{formatDateTime(post.updated_at)}</span>
          {post.category && (
            <>
              <span>·</span>
              <span className="chip">{post.category.name}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/editor/${post.id}`}
          className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-hermes-orange-600"
          aria-label="编辑"
        >
          <Edit3 className="h-4 w-4" />
        </Link>
        <button
          onClick={() => onDelete(post.id)}
          className="rounded-lg p-2 text-ink-500 hover:bg-white hover:text-red-600"
          aria-label="删除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}
