import type { NextConfig } from "next";

const supabaseProjectId =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "tknxlzoejhauuzloezfi";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${supabaseProjectId}.supabase.co`,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
