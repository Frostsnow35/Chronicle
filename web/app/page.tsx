import Link from "next/link";
import HeroCover from "@/components/HeroCover";
import MetaText from "@/components/ui/MetaText";
import SerifHeading from "@/components/ui/SerifHeading";
import GlassCard from "@/components/ui/GlassCard";
import { getGlobalSiteSettings, listSpaces } from "@/lib/data";

export default async function HomePage() {
  const [site, spaces] = await Promise.all([
    getGlobalSiteSettings(),
    listSpaces()
  ]);

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
          <Link
            href="/auth/login?next=/admin"
            className="text-sm font-sans text-ink-700 transition hover:text-hermes-orange-600"
          >
            登录 · 注册 →
          </Link>
        </div>

        <div className="mb-12">
          <MetaText>All spaces</MetaText>
          <SerifHeading level={2} className="mt-2">
            探索空间
          </SerifHeading>
        </div>

        {spaces.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <p className="text-ink-500">还没有任何空间发布公开文章。</p>
            <p className="mt-4">
              <Link
                href="/auth/login?next=/admin"
                className="font-sans text-sm text-hermes-orange-600 hover:underline"
              >
                登录或注册，创建你的第一个空间 →
              </Link>
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {spaces.map((s) => (
              <Link
                key={s.id}
                href={`/@${s.username}`}
                className="group block"
              >
                <GlassCard className="h-full p-6 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    {s.avatar_url ? (
                      <img
                        src={s.avatar_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-hermes-orange-500 to-sky-blue-500 font-serif text-lg font-semibold text-white">
                        {(s.display_name || s.username).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg font-semibold text-ink-950">
                        {s.display_name || s.username}
                      </p>
                      <p className="truncate font-mono text-xs text-ink-500">
                        @{s.username}
                      </p>
                    </div>
                  </div>
                  {s.bio && (
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-700">
                      {s.bio}
                    </p>
                  )}
                  <p className="mt-4 font-sans text-xs text-ink-500">
                    {s.post_count} 篇公开文章
                  </p>
                </GlassCard>
              </Link>
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
