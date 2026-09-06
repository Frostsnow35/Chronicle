import { Suspense } from "react";
import UsernamePageClient from "./UsernamePageClient";

export const metadata = {
  title: "设置空间地址"
};

export default function UsernamePage() {
  return (
    <Suspense fallback={null}>
      <UsernamePageClient />
    </Suspense>
  );
}
