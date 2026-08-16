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
