import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";
import slugify from "slugify";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: Date | string, style: "long" | "short" = "long") {
  const d = typeof input === "string" ? new Date(input) : input;
  if (style === "short") {
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

export function formatDateTime(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleString("zh-CN", { hour12: false });
}

export function makeSlug(title: string) {
  return `${slugify(title, { lower: true, strict: true, trim: true })}-${nanoid(6)}`;
}

export function extractExcerpt(html: string, max = 120) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface CategoryRaw {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

export function buildCategoryTree(list: CategoryRaw[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];
  for (const r of list) {
    map.set(r.id, {
      id: r.id,
      name: r.name,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
      children: []
    });
  }
  for (const r of list) {
    const n = map.get(r.id)!;
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  const sort = (arr: CategoryNode[]) => {
    arr.sort((a, b) => a.sortOrder - b.sortOrder);
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

export function flattenCategoryTree(nodes: CategoryNode[], depth = 0, out: { id: string; name: string; depth: number }[] = []) {
  for (const n of nodes) {
    out.push({ id: n.id, name: n.name, depth });
    flattenCategoryTree(n.children, depth + 1, out);
  }
  return out;
}

/** 收集某个分类自身及其所有后代分类的 id 集合。 */
export function collectDescendantIds(list: CategoryRaw[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const c of list) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return ids;
}

export function randomToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
