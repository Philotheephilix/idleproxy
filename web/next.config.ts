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
};

export default nextConfig;
