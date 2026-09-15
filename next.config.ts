import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep local Turbopack output separate from stale development caches while
  // retaining Vercel's required default output directory in production.
  distDir: process.env.VERCEL ? ".next" : ".next-vibe",
  // Keep Turbopack scoped to this application when a parent directory has a lockfile.
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plum-general-catfish-19.mypinata.cloud",
      },
      {
        protocol: "https",
        hostname: "de.wikipedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
