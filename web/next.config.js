/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // 把新版 Supabase Dashboard 的变量名映射为浏览器可见的 NEXT_PUBLIC_*。
    // 只填 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 即可，无需重复填 NEXT_PUBLIC_*。
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ""
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
