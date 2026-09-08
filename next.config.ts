import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async rewrites() {
    return [
      // 短網址（正式分享網址）
      { source: "/hot", destination: "/products?section=hot" },
      { source: "/new", destination: "/products?section=new" },
      { source: "/categories", destination: "/products" },
      { source: "/c/:slug", destination: "/products?category=:slug" },
      { source: "/p/:id", destination: "/products/:id" },
      { source: "/a/:id", destination: "/activities/:id" },

      // 舊網址保留相容，避免以前分享出去的連結失效
      { source: "/home/:label", destination: "/" },
      { source: "/products/hot/:label", destination: "/products?section=hot" },
      { source: "/products/new/:label", destination: "/products?section=new" },
      { source: "/products/all/:label", destination: "/products?view=all" },
      { source: "/products/categories/:label", destination: "/products" },
      { source: "/products/category/:id/:label", destination: "/products?category=:id" },
      { source: "/activities/all/:label", destination: "/activities" },
      { source: "/products/:id/:name", destination: "/products/:id" },
      { source: "/activities/:id/:name", destination: "/activities/:id" },
    ];
  },
};

export default nextConfig;
