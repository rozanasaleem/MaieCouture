import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL
    ? {}
    : { output: "standalone" as const, outputFileTracingRoot: __dirname }),
  async rewrites() {
    const backend = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
