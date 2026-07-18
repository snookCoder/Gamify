import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost:3000'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;


