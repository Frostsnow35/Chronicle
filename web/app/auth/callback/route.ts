import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await getProfileByUserId(user.id);
        const username = profile?.username ?? "";
        // OAuth 用户未设置用户名（触发器生成了兜底值），先补填用户名
        if (!username || /^u[0-9a-f]{10}$/.test(username)) {
          return NextResponse.redirect(
            `${origin}/auth/username?next=${encodeURIComponent(next)}`
          );
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?next=${encodeURIComponent(next)}`);
}
