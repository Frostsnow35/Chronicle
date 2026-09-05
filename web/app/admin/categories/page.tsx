"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import CategoryTree from "@/components/CategoryTree";
import type { CategoryRaw } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRaw[]>([]);
  const [original, setOriginal] = useState<CategoryRaw[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/categories", { cache: "no-store" });
    const data = await res.json();
    const list: CategoryRaw[] = Array.isArray(data) ? data : [];
    setCategories(list);
    setOriginal(list);
    setDirty(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setDirty(JSON.stringify(categories) !== JSON.stringify(original));
  }, [categories, original]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // 简单策略：删除全部后重建会导致 id 变化。
      // 这里采用增量对比：对每个分类做 upsert。
      const origMap = new Map(original.map((c) => [c.id, c]));
      const newIds = new Set(categories.map((c) => c.id));

      // 删除：原存在于 original 但不在 categories
      for (const orig of original) {
        if (!newIds.has(orig.id)) {
          await fetch(`/api/categories/${orig.id}`, { method: "DELETE" });
        }
      }
      // 新增 / 更新
      for (const cat of categories) {
        const exists = origMap.has(cat.id);
        const payload = {
          name: cat.name,
          parent_id: cat.parent_id,
          sort_order: cat.sort_order
        };
        if (exists) {
          await fetch(`/api/categories/${cat.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      }
      await load();
      setMsg("分类已保存。");
    } catch (e: any) {
      setMsg("保存失败：" + (e?.message || "请重试"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <MetaText>Taxonomy</MetaText>
          <SerifHeading level={2} className="mt-2">
            分类管理
          </SerifHeading>
        </div>
        {dirty && (
          <button onClick={save} disabled={saving} className="glass-button-primary">
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存修改"}
          </button>
        )}
      </div>

      {msg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <GlassCard className="p-6 md:p-8">
        <p className="mb-6 text-sm text-ink-600">
          拖拽可调整顺序，点击 <span className="font-medium">＋</span> 新增子分类，
          悬停可重命名或删除（需先删除或移走子分类）。
        </p>
        <CategoryTree
          categories={categories}
          editable
          onChange={(next) => setCategories(next)}
        />
      </GlassCard>
    </div>
  );
}
