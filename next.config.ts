import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The dev badge sits on top of the bottom-nav menu button on phones
  devIndicators: false,
};

export default nextConfig;
