import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 2678400, // 31 days to conserve Vercel Free Image Optimization quota
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [48, 96, 128, 256, 384],
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
