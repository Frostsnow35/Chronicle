import { notFound } from "next/navigation";
import HeroCover from "@/components/HeroCover";
import PostCard from "@/components/PostCard";
import MetaText from "@/components/ui/MetaText";
import SerifHeading from "@/components/ui/SerifHeading";
import GlassCard from "@/components/ui/GlassCard";
import { getProfileByUsername, getSpacePosts } from "@/lib/data";
import { getTheme } from "@/lib/themes";

export default async function SpaceHomePage({
  params
}: {
  params: { username: string };
}) {
  const username = params.username.toLowerCase();
  const [profile, posts] = await Promise.all([
    getProfileByUsername(username),
    getSpacePosts(username, { limit: 20 })
  ]);
  if (!profile) notFound();

  const theme = getTheme(profile.theme);

  return (
    <div className="home-scroll h-[100svh] w-full snap-y snap-proximity overflow-y-auto scroll-smooth">
      <HeroCover
        siteName={profile.display_name || profile.username}
        tagline={profile.bio || `@${username} 的文字空间`}
        accent={theme.accent}
        secondary={theme.secondary}
      />

      <section
        id="post-list"
        className="mx-auto w-full max-w-3xl snap-start px-6 py-16 md:py-24"
      >
        <div className="mb-12">
          <MetaText>Writing</MetaText>
          <SerifHeading level={2} className="mt-2">
            最新文字
          </SerifHeading>
        </div>

        {posts.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <p className="text-ink-500">这个空间还没有发布公开文章。</p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {posts.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <PostCard post={p} username={username} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="divider-soft mb-8" />
          <p className="font-serif text-sm text-ink-500">@{username}</p>
        </div>
      </section>
    </div>
  );
}
