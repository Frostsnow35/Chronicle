import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import { getCategoryWithPosts } from "@/lib/data";

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { category } = await getCategoryWithPosts(params.id);
  if (!category) return { title: "分类" };
  return { title: category.name };
}

export default async function CategoryPostsPage({
  params
}: {
  params: { id: string };
}) {
  const { category, posts } = await getCategoryWithPosts(params.id);
  if (!category) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href="/categories" className="link-muted font-sans text-sm">
        ← 全部分类
      </Link>
      <div className="mt-10 mb-12">
        <MetaText>Category</MetaText>
        <SerifHeading level={1} className="mt-2">
          {category.name}
        </SerifHeading>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/60 p-16 text-center backdrop-blur-xl">
          <p className="text-ink-500">该分类下还没有公开文章。</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
