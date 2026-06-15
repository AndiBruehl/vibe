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
