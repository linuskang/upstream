import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/db", "@workspace/ui"],
  output: "standalone",
  allowedDevOrigins: ["upstream-dev.linus.my"]
}

export default nextConfig
