import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata = {
  title: "作者登录 / 注册"
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
