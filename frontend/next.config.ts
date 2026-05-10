import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the "multiple lockfiles" warning — root is paylink/, not C:\Users\Abraham
  outputFileTracingRoot: path.join(__dirname, "../"),
  transpilePackages: ["@lifi/widget", "@lifi/sdk"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;
