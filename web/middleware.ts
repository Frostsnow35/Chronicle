import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const pathname = request.nextUrl.pathname;
  const isPostOrCategoryRoute = /^\/(posts|categories)\/.*/.test(pathname);

  // 1. /admin/** 必须登录
  if (pathname.startsWith("/admin") && !user) {
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
    if (isPublicApi || user) return response;

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
