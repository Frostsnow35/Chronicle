import type { Metadata } from "next";
import "../styles/globals.css";
import GradientBackground from "@/components/GradientBackground";

export const metadata: Metadata = {
  title: {
    default: "Chronicle",
    template: "%s · Chronicle"
  },
  description: "用文字锚定时间。",
  openGraph: {
    title: "Chronicle",
    description: "用文字锚定时间。",
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
