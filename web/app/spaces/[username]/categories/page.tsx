import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import GlassCard from "@/components/ui/GlassCard";
import { getProfileByUsername, getSpaceCategories } from "@/lib/data";
import { buildCategoryTree } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  return {
    title: profile ? `${profile.display_name || profile.username} 的分类` : "分类"
  };
}

export default async function SpaceCategoriesPage({
  params
}: {
  params: { username: string };
}) {
  const username = params.username.toLowerCase();
  const [profile, categories] = await Promise.all([
    getProfileByUsername(username),
    getSpaceCategories(username)
  ]);
  if (!profile) notFound();
  const tree = buildCategoryTree(categories);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href={`/@${username}`} className="link-muted font-sans text-sm">
        ← 返回空间首页
      </Link>
      <div className="mb-12 mt-10">
        <MetaText>Categories</MetaText>
        <SerifHeading level={1} className="mt-2">
          分类
        </SerifHeading>
      </div>

      {tree.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="text-ink-500">这个空间还没有分类。</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {tree.map((root) => (
            <CategoryNode
              key={root.id}
              node={root}
              depth={0}
              username={username}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({
  node,
  depth,
  username
}: {
  node: ReturnType<typeof buildCategoryTree>[number];
  depth: number;
  username: string;
}) {
  return (
    <div>
      <Link
        href={`/@${username}/categories/${node.id}`}
        className="glass-card block px-6 py-4 transition hover:-translate-y-0.5"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <span className="font-serif text-lg text-ink-900 hover:text-accent-strong">
          {node.name}
        </span>
      </Link>
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              username={username}
            />
          ))}
        </div>
      )}
    </div>
  );
}
