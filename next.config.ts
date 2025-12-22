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
      {
        protocol: "http",
        hostname: "localhost",
        port: "3333",
        pathname: "/**",
      },
    ],
    // Tắt tối ưu hóa ảnh trong development để tránh lỗi với localhost
    unoptimized: process.env.NODE_ENV === "development",
  },
  devIndicators: false,
};

export default nextConfig;
