"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface HeroCoverProps {
  siteName?: string;
  tagline?: string;
  accent?: string;
  secondary?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 首屏整屏封面：纯视觉渐变，无卡片无边框。
 * 底部提供动态“下滑进入”指引，点击或滚动整屏切入文章列表。
 * 强调色与辅色可通过 accent / secondary 传入，用于空间主题切换。
 */
export default function HeroCover({
  siteName = "Chronicle",
  tagline = "用文字锚定时间",
  accent = "#ff6b00",
  secondary = "#38bdf8"
}: HeroCoverProps) {
  const scrollToList = () => {
    const el = document.getElementById("post-list");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative h-[100svh] w-full shrink-0 snap-start overflow-hidden">
      {/* 双色渐变 + 模糊 */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 18% 22%, ${hexToRgba(accent, 0.92)} 0%, ${hexToRgba(accent, 0)} 55%), ` +
            `radial-gradient(circle at 82% 78%, ${hexToRgba(secondary, 0.95)} 0%, ${hexToRgba(secondary, 0)} 55%), ` +
            `linear-gradient(135deg, ${hexToRgba(accent, 0.7)}, ${hexToRgba(secondary, 0.7)})`,
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

      {/* 中央文字：直接浮于渐变之上，无卡片无按钮框 */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <p
          className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-ink-800/75"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          A minimalist journal
        </p>
        <h1
          className="font-serif text-6xl font-semibold leading-tight tracking-tight text-ink-950 md:text-7xl"
          style={{ textShadow: "0 1px 3px rgba(255,255,255,0.45)" }}
        >
          {siteName}
        </h1>
        <div className="mx-auto my-7 h-px w-28 bg-gradient-to-r from-transparent via-ink-800/50 to-transparent" />
        <p
          className="font-serif text-xl text-ink-900/90 md:text-2xl"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.35)" }}
        >
          {tagline}
        </p>
      </div>

      {/* 底部动态下滑指引（连续下落的倒 V） */}
      <div className="absolute inset-x-0 bottom-7 z-10 flex justify-center">
        <button
          type="button"
          onClick={scrollToList}
          aria-label="向下滑动进入文章"
          className="flex flex-col items-center gap-3 px-6 py-2 transition-opacity hover:opacity-70"
        >
          <span className="flex flex-col items-center" aria-hidden="true">
            <ChevronDown
              className="h-6 w-6 animate-cue-drop text-ink-900"
              style={{ animationDelay: "0s" }}
            />
            <ChevronDown
              className="-mt-3.5 h-6 w-6 animate-cue-drop text-ink-900"
              style={{ animationDelay: "0.16s" }}
            />
            <ChevronDown
              className="-mt-3.5 h-6 w-6 animate-cue-drop text-ink-900"
              style={{ animationDelay: "0.32s" }}
            />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-ink-800/80">
            滑动进入
          </span>
        </button>
      </div>
    </section>
  );
}
