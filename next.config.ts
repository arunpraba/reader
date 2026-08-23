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
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
