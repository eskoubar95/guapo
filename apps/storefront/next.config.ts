import type { NextConfig } from "next";
import path from "node:path";

const supabaseProjectId =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "tknxlzoejhauuzloezfi";

function medusaImageRemotePattern(): {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
} {
  const raw = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  try {
    const u = new URL(raw);
    return {
      protocol: u.protocol === "https:" ? "https" : "http",
      hostname: u.hostname,
      pathname: "/**",
    };
  } catch {
    return { protocol: "http", hostname: "localhost", pathname: "/**" };
  }
}

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
      medusaImageRemotePattern(),
    ],
  },
};

export default nextConfig;
