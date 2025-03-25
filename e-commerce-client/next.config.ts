import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;