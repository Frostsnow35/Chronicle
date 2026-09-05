import Link from "next/link";
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
        className="mx-auto w-full max-w-3xl snap-start px-6 py-20 md:py-28"
      >
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
