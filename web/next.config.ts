import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // web/ has its own lockfile, separate from the repo root's — this
  // silences Next.js's ambiguous-workspace-root warning by pointing it at
  // the right one explicitly: web/ is a standalone deployable, not part of
  // the router's dependency tree.
  turbopack: {
    root: path.join(__dirname),
  },
  // Self-contained production server bundle for the Docker image -- copies
  // only the traced dependency subset into .next/standalone instead of
  // shipping full node_modules.
  output: "standalone",
};

export default nextConfig;
