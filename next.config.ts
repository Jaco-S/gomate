import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyFile: './middleware.ts'
  }
};

export default nextConfig;
