"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Loader2, Puzzle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";

export default function AdminPluginPage() {
  const [storeUrl, setStoreUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setStoreUrl(d?.value?.chrome_web_store_url || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-hermes-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <MetaText>Extension</MetaText>
        <SerifHeading level={2} className="mt-2">
          安装插件
        </SerifHeading>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          把 Chronicle 浏览器插件装进 Chrome / Edge，随时在浏览网页时记下灵感，保存到你的站点。
        </p>
      </div>

      {/* 商店一键安装 */}
      <GlassCard className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-hermes-orange-500" />
          <h3 className="font-serif text-xl font-semibold text-ink-950">
            一键安装（Chrome 应用店）
          </h3>
        </div>

        {storeUrl ? (
          <>
            <p className="mb-5 text-sm text-ink-600">
              点击下方按钮，在新页面点击「添加至 Chrome」并确认授权，即可完成安装。
            </p>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button-primary inline-flex"
            >
              <ExternalLink className="h-4 w-4" />
              前往 Chrome 应用店安装
            </a>

            <div className="mt-6 rounded-2xl bg-white/50 p-4 text-xs leading-relaxed text-ink-600">
              <p className="font-semibold text-ink-800">安装步骤：</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>点击上方按钮，跳转到 Chrome 应用店该插件页</li>
                <li>点击「添加至 Chrome」，在弹窗中确认</li>
                <li>安装完成后，浏览器工具栏会出现 Chronicle 图标</li>
                <li>回到「插件配对」页生成配对链接，完成插件与站点的连接</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-600">
              尚未上架 Chrome 应用店。完成上架后，把商店地址填到「设置 → 插件商店地址」，这里就会出现一键安装按钮。
            </p>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-800">
              <p className="font-semibold">上架需要三步：</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>注册 Chrome 开发者账号（一次性 5 美元）</li>
                <li>按上架文档打包插件 ZIP 并准备图标与截图</li>
                <li>提交商店审核，通过后复制商店地址回填到设置</li>
              </ol>
              <p className="mt-3">
                详细步骤见{' '}
                <a
                  href="https://github.com/Frostsnow35/Chronicle/blob/main/docs/06-publish-chrome-web-store.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  插件上架文档（GitHub）
                </a>
                。
              </p>
            </div>
          </>
        )}
      </GlassCard>

      {/* 上架前回退：开发者模式 */}
      <GlassCard className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-sky-blue-600" />
          <h3 className="font-serif text-xl font-semibold text-ink-950">
            上架前：开发者模式手动加载
          </h3>
        </div>
        <p className="mb-4 text-sm text-ink-600">
          在插件通过商店上架前，你可以先用开发者模式手动加载插件自用。步骤见安装文档。
        </p>
        <Link
          href="https://github.com/Frostsnow35/Chronicle/blob/main/docs/03-install-extension.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-sky-blue-700 underline underline-offset-2 hover:text-sky-blue-900"
        >
          查看手动安装文档 →
        </Link>
      </GlassCard>
    </div>
  );
}
