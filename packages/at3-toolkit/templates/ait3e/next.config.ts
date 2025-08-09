import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration (disabled since we use Biome)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features for AIT3E stack
  experimental: {
    // Performance optimizations
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "framer-motion",
      "ai",
      "@ai-sdk/openai",
      "@ai-sdk/anthropic",
      "@ai-sdk/google",
    ],

    // Enhanced caching for AI responses
    staleTimes: {
      dynamic: isDev ? 0 : 30,
      static: isDev ? 30 : 180,
    },

    // Edge runtime optimizations for AI
    serverComponentsExternalPackages: ["ai", "@ai-sdk/openai"],

    // Development enhancements
    ...(isDev && {
      serverComponentsHmrCache: true,
    }),
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      // Add other AI-generated image sources as needed
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Bundle analyzer
  ...(process.env.ANALYZE === "true" && {
    bundlePagesExternalPackages: ["sharp"],
  }),

  // Headers for AI streaming and CORS
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },

  // Rewrites for AI API routes
  async rewrites() {
    return [
      {
        source: "/ai/:path*",
        destination: "/api/ai/:path*",
      },
    ];
  },
};

export default nextConfig;
