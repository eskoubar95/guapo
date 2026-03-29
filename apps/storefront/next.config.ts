import type { NextConfig } from "next";
import path from "node:path";

const supabaseProjectId =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "tknxlzoejhauuzloezfi";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
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
