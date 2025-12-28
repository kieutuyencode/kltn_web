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
  webpack: (config) => {
    // Ignore test files and other unnecessary files from thread-stream
    const webpack = require("webpack");
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/test\/|^\.\/bench\.js$|^\.\/LICENSE$|^\.\/README\.md$/,
        contextRegExp: /thread-stream$/,
      })
    );

    return config;
  },
};

export default nextConfig;
