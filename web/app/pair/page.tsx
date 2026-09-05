"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import Button from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function PairExchangePage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    setSiteOrigin(window.location.origin);
    if (!token) {
      setError("缺少 token 参数。请从后台复制完整的配对链接。");
      setStatus("error");
      return;
    }
    // 本页只展示 token 值，真正的 exchange 由插件调用 /api/pairing/exchange 完成
    setTimeout(() => setStatus("error"), 600);
    setError(
      "此页面仅供浏览器插件自动读取使用。请打开插件 → 设置 → 一键配对 → 粘贴完整配对链接。"
    );
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <GlassCard className="w-full max-w-lg p-8 md:p-10 text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-hermes-orange-500" />
            <SerifHeading level={3} className="mt-6">
              正在准备配对…
            </SerifHeading>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <SerifHeading level={3} className="mt-6">
              配对链接正确
            </SerifHeading>
            <p className="mt-3 text-sm text-ink-700">{error}</p>
            <div className="mt-6 rounded-2xl bg-white/70 p-4 text-left font-mono text-xs break-all text-ink-700 border border-ink-200">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-ink-500">
                你的站点域名（插件 Options 中测试连接成功会自动保存）：
              </div>
              {siteOrigin}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/">
                <Button variant="default">返回首页</Button>
              </Link>
              <Link href="/admin/pairing">
                <Button variant="primary">前往后台生成配对链接</Button>
              </Link>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
