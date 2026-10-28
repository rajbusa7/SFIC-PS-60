import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/landing-3d",
          destination: "/landing-pages/inner-green-3d.html",
        },
      ],
    };
  },
};

export default nextConfig;
