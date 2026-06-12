import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plum-general-catfish-19.mypinata.cloud",
      },
    ],
  },
};

export default nextConfig;
