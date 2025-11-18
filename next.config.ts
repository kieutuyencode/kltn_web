import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Cho phép ảnh từ mọi domain HTTPS
      },
      {
        protocol: "http",
        hostname: "**", // Cho phép ảnh từ mọi domain HTTP
      },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
