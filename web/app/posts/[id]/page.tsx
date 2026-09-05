import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import ShareButtons from "@/components/ShareButtons";
import GlassCard from "@/components/ui/GlassCard";
import { getPublicPostBySlug, getSiteSettings } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPublicPostBySlug(params.id);
  if (!post) return { title: "未找到" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const [post, site] = await Promise.all([
    getPublicPostBySlug(params.id),
    getSiteSettings()
  ]);
  if (!post) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href="/" className="link-muted font-sans text-sm">
        ← 返回首页
      </Link>

      <article className="mt-10">
        <header className="mb-12 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <MetaText>{formatDate(post.created_at)}</MetaText>
            {post.category && (
              <>
                <span className="text-ink-300">·</span>
                <span className="chip">{post.category.name}</span>
              </>
            )}
          </div>
          <SerifHeading level={1} className="text-4xl md:text-5xl">
            {post.title}
          </SerifHeading>
          {site.author && (
            <p className="mt-4 text-sm text-ink-500">文 / {site.author}</p>
          )}
        </header>

        <div className="divider-soft mb-10" />

        <div
          className="prose-minimal"
          dangerouslySetInnerHTML={{ __html: post.content_html || post.excerpt }}
        />

        <div className="mt-14">
          <div className="divider-soft mb-8" />
          <div className="flex flex-col items-center gap-4">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-500">
              分享这篇文章
            </p>
            <ShareButtons title={post.title} />
          </div>
        </div>
      </article>

      <footer className="mt-20 text-center">
        <div className="divider-soft mb-8" />
        <p className="font-serif text-sm text-ink-500">
          © {new Date().getFullYear()} {site.name} · {site.footer_text}
        </p>
      </footer>
    </div>
  );
}
