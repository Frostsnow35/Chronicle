import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/callback",
  "/posts",
  "/categories",
  "/pair",
  "/robots.txt",
  "/favicon.ico",
  "/sitemap.xml"
]);

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/pairing/exchange",
  "/api/storage",
  "/api/notes",
  "/api/posts"
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 0. /@用户名 空间公开路由：@ 在 Next.js 中是并行路由保留符，无法作为目录名，
  //    这里将 /@alice(/...) 内部重写为 /spaces/alice(/...)，浏览器地址栏保持 /@alice。
  const rawPath = request.nextUrl.pathname;
  if (rawPath.startsWith("/@")) {
    const url = request.nextUrl.clone();
    url.pathname = "/spaces/" + rawPath.slice(2);
    return NextResponse.rewrite(url);
  }

  const supabase = createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // access token 过期时 getUser 返回 null，这里用 refresh token 尝试续期，
  // 避免刷新页面、新开标签页或重开浏览器后被误判为未登录。
  let currentUser = user;
  if (!currentUser) {
    const { data: sessionData } = await supabase.auth.getSession();
    const refreshToken = sessionData.session?.refresh_token;
    if (refreshToken) {
      const { data: refreshed } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      currentUser = refreshed.session?.user ?? refreshed.user ?? null;
    }
  }

  const pathname = request.nextUrl.pathname;
  const isPostOrCategoryRoute = /^\/(posts|categories)\/.*/.test(pathname);

  // 1. /admin/** 必须登录
  if (pathname.startsWith("/admin") && !currentUser) {
    const redirect = new URL("/auth/login", request.url);
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // 2. 公开路径直接放行
  if (PUBLIC_PATHS.has(pathname) || isPostOrCategoryRoute) {
    return response;
  }

  // 3. /api/**：允许 public prefixes 或已登录或 Bearer Token
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isPublicApi || currentUser) return response;

    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) return response;

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"
  ]
};
