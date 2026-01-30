import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack configuration for Next.js 16
  turbopack: {},

  // For production builds, we may need to use webpack
  webpack: (config, { isServer }) => {
    // Handle WASM files from Magma SDK dependencies
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
