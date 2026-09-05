"use client";

import React, { useState } from "react";
import { Link2, Check, Twitter, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
}

export default function ShareButtons({ title, url, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const items = [
    {
      label: "复制链接",
      icon: copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />,
      onClick: copy,
      className: "hover:bg-white/80"
    },
    {
      label: "分享到 X",
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "hover:bg-sky-blue-50"
    },
    {
      label: "分享到微博",
      icon: <MessageCircle className="h-4 w-4" />,
      href: `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`,
      className: "hover:bg-hermes-orange-50"
    }
  ];

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {items.map((it) =>
        it.href ? (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-4 py-2 text-xs font-medium text-ink-700 backdrop-blur transition ${it.className}`}
          >
            {it.icon}
            {it.label}
          </a>
        ) : (
          <button
            key={it.label}
            onClick={it.onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-4 py-2 text-xs font-medium text-ink-700 backdrop-blur transition ${it.className}`}
          >
            {it.icon}
            {copied ? "已复制" : it.label}
          </button>
        )
      )}
    </div>
  );
}
