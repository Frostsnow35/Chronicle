import { Suspense } from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen px-6 py-16 text-center text-ink-500">加载中…</div>}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
