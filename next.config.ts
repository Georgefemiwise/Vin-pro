import type { NextConfig } from "next";

const config: NextConfig = {
  webpack: (config) => {
    // Required for tesseract.js worker compatibility
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};

export default config;
