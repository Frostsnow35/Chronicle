import Link from "next/link";
import { Search } from "lucide-react";
import HeroCover from "@/components/HeroCover";
import PostCard from "@/components/PostCard";
import MetaText from "@/components/ui/MetaText";
import SerifHeading from "@/components/ui/SerifHeading";
import { getPublicPosts, getSiteSettings } from "@/lib/data";

export default async function HomePage() {
  const [site, posts] = await Promise.all([getSiteSettings(), getPublicPosts({ limit: 20 })]);

  return (
    <div className="home-scroll h-[100svh] w-full snap-y snap-proximity overflow-y-auto scroll-smooth">
      <HeroCover siteName={site.name} tagline={site.tagline} />

      <section
        id="post-list"
        className="mx-auto w-full max-w-3xl snap-start px-6 py-16 md:py-24"
      >
        <div className="sticky top-0 z-20 -mx-6 mb-12 flex items-center justify-between bg-white/60 px-6 py-4 backdrop-blur-md md:-mx-0 md:px-0">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500">
            {site.name}
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/search"
              aria-label="搜索文章"
              className="text-ink-500 transition hover:text-hermes-orange-600"
            >
              <Search className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login?next=/admin"
              className="text-sm font-sans text-ink-700 transition hover:text-hermes-orange-600"
            >
              作者登录 · 注册 →
            </Link>
          </div>
        </div>

        <div className="mb-12 flex items-end justify-between">
          <div>
            <MetaText>Recent writing</MetaText>
            <SerifHeading level={2} className="mt-2">
              最新文字
            </SerifHeading>
          </div>
          <Link href="/categories" className="link-muted text-sm font-sans">
            按分类浏览 →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/60 p-16 text-center backdrop-blur-xl">
            <p className="text-ink-500">作者还没有发布公开文章。</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <PostCard post={p} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="divider-soft mb-8" />
          <p className="font-serif text-sm text-ink-500">
            © {new Date().getFullYear()} {site.name} · {site.footer_text}
          </p>
        </div>
      </section>
    </div>
  );
}
