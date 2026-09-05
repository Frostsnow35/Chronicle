"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  Edit3,
  Trash2,
  Plus,
  GripVertical,
  Check,
  X
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { twMerge } from "tailwind-merge";
import type { CategoryNode, CategoryRaw } from "@/lib/utils";
import { buildCategoryTree } from "@/lib/utils";

export interface CategoryTreeProps {
  categories: CategoryRaw[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  editable?: boolean;
  onChange?: (next: CategoryRaw[]) => void;
}

export default function CategoryTree({
  categories,
  selectedId,
  onSelect,
  editable = false,
  onChange
}: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const tree = buildCategoryTree(categories);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRenameSave = (id: string) => {
    if (!onChange || !nameDraft.trim()) {
      setRenaming(null);
      return;
    }
    const next = categories.map((c) =>
      c.id === id ? { ...c, name: nameDraft.trim() } : c
    );
    onChange(next);
    setRenaming(null);
    setNameDraft("");
  };

  const handleDelete = (id: string) => {
    if (!onChange) return;
    const removedIds = new Set<string>([id]);
    // 级联移除其子分类（防止脏数据）
    let added = true;
    while (added) {
      added = false;
      for (const c of categories) {
        if (c.parent_id && removedIds.has(c.parent_id) && !removedIds.has(c.id)) {
          removedIds.add(c.id);
          added = true;
        }
      }
    }
    const next = categories.filter((c) => !removedIds.has(c.id));
    onChange(next);
  };

  const handleAddChild = (parentId: string | null) => {
    if (!onChange) return;
    const order = Math.max(0, ...categories.map((c) => c.sort_order)) + 1;
    const newCat: CategoryRaw = {
      id: `new-${Math.random().toString(36).slice(2, 10)}`,
      name: "新分类",
      parent_id: parentId,
      sort_order: order
    };
    onChange([...categories, newCat]);
    if (parentId) setExpanded((s) => new Set(s).add(parentId));
    setRenaming(newCat.id);
    setNameDraft("新分类");
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!onChange) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIdx = categories.findIndex((c) => c.id === activeId);
    const newIdx = categories.findIndex((c) => c.id === overId);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = categories.slice();
    const [moved] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, moved);
    // 更新 sort_order 依据新顺序
    next.forEach((c, i) => (c.sort_order = i * 10));
    onChange(next);
  };

  const flatIds = categories.map((c) => c.id);

  return (
    <div className="space-y-1">
      {editable && (
        <button
          type="button"
          onClick={() => handleAddChild(null)}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-dashed border-ink-300 bg-white/40 px-3 py-1.5 text-xs text-ink-600 transition hover:border-hermes-orange-400 hover:text-hermes-orange-700"
        >
          <Plus className="h-3.5 w-3.5" /> 新建一级分类
        </button>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {tree.map((node) => (
              <NodeView
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                selectedId={selectedId}
                onSelect={onSelect}
                editable={editable}
                renaming={renaming}
                nameDraft={nameDraft}
                setRenaming={(id) => {
                  setRenaming(id);
                  if (id) {
                    const c = categories.find((x) => x.id === id);
                    setNameDraft(c?.name || "");
                  }
                }}
                setNameDraft={setNameDraft}
                handleRenameSave={handleRenameSave}
                handleDelete={handleDelete}
                handleAddChild={handleAddChild}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <p className="rounded-2xl border border-dashed border-ink-200 bg-white/50 p-6 text-center text-sm text-ink-500">
          还没有分类，点击上方「新建一级分类」开始创建。
        </p>
      )}
    </div>
  );
}

interface NodeViewProps {
  node: CategoryNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  editable?: boolean;
  renaming: string | null;
  nameDraft: string;
  setRenaming: (id: string | null) => void;
  setNameDraft: (s: string) => void;
  handleRenameSave: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAddChild: (parentId: string | null) => void;
}

function NodeView(props: NodeViewProps) {
  const { node, depth, expanded, onToggle, selectedId, onSelect, editable } =
    props;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16}px`,
    opacity: isDragging ? 0.4 : 1
  };

  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={twMerge(
          "group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm transition",
          isSelected
            ? "bg-gradient-to-r from-hermes-orange-100/70 to-sky-blue-100/70 border-white/60"
            : "hover:bg-white/70 hover:border-white/60"
        )}
      >
        {editable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-ink-400 group-hover:text-ink-700"
            aria-label="拖拽排序"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          className="text-ink-500 hover:text-ink-800 disabled:opacity-0"
          onClick={() => onToggle(node.id)}
          disabled={!hasChildren}
          aria-label="展开/收起"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => onSelect?.(isSelected ? null : node.id)}
        >
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-hermes-orange-500" />
          ) : (
            <FileText className="h-4 w-4 text-sky-blue-600" />
          )}
          {props.renaming === node.id ? (
            <input
              autoFocus
              value={props.nameDraft}
              onChange={(e) => props.setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") props.handleRenameSave(node.id);
                if (e.key === "Escape") props.setRenaming(null);
              }}
              className="flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1 outline-none focus:border-hermes-orange-400"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={twMerge(
                "truncate",
                isSelected ? "font-semibold text-ink-900" : "text-ink-800"
              )}
            >
              {node.name}
            </span>
          )}
        </button>

        {editable && (
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {props.renaming === node.id ? (
              <>
                <button
                  onClick={() => props.handleRenameSave(node.id)}
                  className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50"
                  aria-label="保存"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => props.setRenaming(null)}
                  className="rounded-lg p-1 text-ink-500 hover:bg-white"
                  aria-label="取消"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => props.handleAddChild(node.id)}
                  className="rounded-lg p-1 text-ink-500 hover:bg-white hover:text-hermes-orange-600"
                  aria-label="新增子分类"
                  title="新增子分类"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => props.setRenaming(node.id)}
                  className="rounded-lg p-1 text-ink-500 hover:bg-white hover:text-hermes-orange-600"
                  aria-label="重命名"
                  title="重命名"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => props.handleDelete(node.id)}
                  className="rounded-lg p-1 text-ink-500 hover:bg-white hover:text-red-600"
                  aria-label="删除"
                  title="删除（需先删除或移动子分类）"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {isOpen && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <NodeView key={child.id} {...props} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
