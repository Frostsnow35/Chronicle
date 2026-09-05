"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";

interface HeroCoverProps {
  siteName?: string;
  tagline?: string;
}

export default function HeroCover({
  siteName = "Chronicle",
  tagline = "用文字锚定时间"
}: HeroCoverProps) {
  const scrollToList = () => {
    const el = document.getElementById("post-list");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* 橙蓝双色渐变 + 模糊 */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 22%, rgba(255,107,0,0.92) 0%, rgba(255,107,0,0) 55%), radial-gradient(circle at 82% 78%, rgba(56,189,248,0.95) 0%, rgba(56,189,248,0) 55%), linear-gradient(135deg, rgba(255,165,94,0.7), rgba(147,219,255,0.7))",
          filter: "blur(2px) saturate(125%)"
        }}
      />
      {/* 流动光斑 */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full opacity-60 mix-blend-screen animate-float-gradient"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 60%)"
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full opacity-70 mix-blend-screen animate-float-gradient-reverse"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 60%)"
        }}
      />
      {/* 细腻噪点（让渐变有杂志感） */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"
        }}
      />

      {/* 中央玻璃卡片 */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="glass-card-strong max-w-2xl px-10 py-12 text-center animate-fade-up">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-ink-700/70">
            A minimalist journal
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight text-ink-950">
            {siteName}
          </h1>
          <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-ink-500 to-transparent" />
          <p className="font-serif text-lg text-ink-800/85">{tagline}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={scrollToList}
              className="glass-button-primary !rounded-full !px-7"
            >
              开始阅读
              <ArrowDown className="h-4 w-4" />
            </button>
            <Link
              href="/categories"
              className="glass-button text-ink-900 hover:bg-white"
            >
              按分类浏览
            </Link>
          </div>
        </div>
      </div>

      {/* 底部下滑提示 */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <button
          aria-label="向下滚动"
          onClick={scrollToList}
          className="glass-card p-2 text-ink-800 hover:bg-white"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
