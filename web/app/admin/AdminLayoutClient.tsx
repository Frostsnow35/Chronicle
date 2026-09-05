"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PenLine,
  FolderTree,
  Puzzle,
  Settings,
  LogOut,
  LayoutDashboard,
  Download,
  ExternalLink
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "文章", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/editor", label: "写文章", icon: <PenLine className="h-4 w-4" /> },
  { href: "/admin/categories", label: "分类", icon: <FolderTree className="h-4 w-4" /> },
  { href: "/admin/plugin", label: "安装插件", icon: <Download className="h-4 w-4" /> },
  { href: "/admin/pairing", label: "插件配对", icon: <Puzzle className="h-4 w-4" /> },
  { href: "/admin/settings", label: "设置", icon: <Settings className="h-4 w-4" /> }
];

export default function AdminLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (!cancelled) setEmail(data.user?.email || null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        {/* 左侧导航 */}
        <aside className="md:sticky md:top-6 md:self-start">
          <GlassCard className="p-5">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-hermes-orange-500 to-sky-blue-500 shadow-glass">
                <ExternalLink className="h-4 w-4 text-white" />
              </span>
              <div className="font-serif text-lg font-semibold text-ink-950 leading-none">
                返回首页
              </div>
            </Link>

            <div className="mt-6 space-y-1">
              {NAV.map((it) => {
                const active =
                  pathname === it.href ||
                  (it.href !== "/admin" && pathname.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-gradient-to-r from-hermes-orange-100/80 to-sky-blue-100/80 text-ink-950 font-medium shadow-inner border border-white/60"
                        : "text-ink-700 hover:bg-white/70"
                    }`}
                  >
                    {it.icon}
                    {it.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                当前登录
              </p>
              <p className="mt-1 truncate text-sm font-medium text-ink-800">
                {email || "加载中…"}
              </p>
              <button
                onClick={logout}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-xs font-medium text-red-600 backdrop-blur transition hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出登录
              </button>
            </div>
          </GlassCard>
        </aside>

        {/* 主内容区 */}
        <div>{children}</div>
      </div>
    </div>
  );
}
