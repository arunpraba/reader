import type { NextConfig } from "next";

/** Project Pages URL: https://arunpraba.github.io/reader/ */
const repo = "reader";
const basePath = process.env.GITHUB_PAGES === "true" ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  // Emulator reaches the host Next server via 10.0.2.2
  allowedDevOrigins: ["10.0.2.2", "127.0.0.1", "localhost"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
