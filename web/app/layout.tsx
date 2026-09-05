import type { Metadata } from "next";
import "../styles/globals.css";
import GradientBackground from "@/components/GradientBackground";

export const metadata: Metadata = {
  title: {
    default: "我的文字花园",
    template: "%s · 我的文字花园"
  },
  description: "一个极简主义的个人文字记录空间。",
  openGraph: {
    title: "我的文字花园",
    description: "极简主义的个人文字记录空间。",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-serif min-h-screen">
        <GradientBackground />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
