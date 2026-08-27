import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["playwright", "sharp"],
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
};

export default nextConfig;
