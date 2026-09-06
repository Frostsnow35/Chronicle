import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProfileByUsername } from "@/lib/data";
import { isThemeKey } from "@/lib/themes";

export async function generateMetadata({
  params
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: "空间不存在" };
  return { title: profile.display_name || profile.username };
}

export default async function SpaceLayout({
  params,
  children
}: {
  params: { username: string };
  children: React.ReactNode;
}) {
  const username = params.username.toLowerCase();
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const theme = isThemeKey(profile.theme) ? profile.theme : "orange";

  return (
    <div data-theme={theme} className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="font-sans text-sm text-ink-600 transition hover:text-accent-strong"
          >
            ← 全部空间
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href={`/@${username}/categories`}
              className="font-sans text-sm text-ink-600 transition hover:text-accent-strong"
            >
              分类
            </Link>
            <Link
              href={`/@${username}/search`}
              className="font-sans text-sm text-ink-600 transition hover:text-accent-strong"
            >
              搜索
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
