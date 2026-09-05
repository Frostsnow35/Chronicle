import Link from "next/link";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import GlassCard from "@/components/ui/GlassCard";
import { getAdminClient } from "@/lib/supabase/admin";
import { buildCategoryTree, type CategoryRaw } from "@/lib/utils";

export const metadata = { title: "分类" };

async function getCategories(): Promise<CategoryRaw[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("categories")
      .select("id,name,parent_id,sort_order,created_at")
      .order("sort_order", { ascending: true });
    return (data ?? []) as CategoryRaw[];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const tree = buildCategoryTree(categories);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href="/" className="link-muted font-sans text-sm">
        ← 返回首页
      </Link>
      <div className="mt-10 mb-12">
        <MetaText>Categories</MetaText>
        <SerifHeading level={1} className="mt-2">
          分类
        </SerifHeading>
      </div>

      {tree.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="text-ink-500">作者还没有创建分类。</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {tree.map((root) => (
            <CategoryNode key={root.id} node={root} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({
  node,
  depth
}: {
  node: ReturnType<typeof buildCategoryTree>[number];
  depth: number;
}) {
  return (
    <div>
      <Link
        href={`/categories/${node.id}`}
        className="glass-card block px-6 py-4 transition hover:-translate-y-0.5"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <span className="font-serif text-lg text-ink-900 hover:text-hermes-orange-700">
          {node.name}
        </span>
      </Link>
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
