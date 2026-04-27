import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The UI lives inside the career-ops repo, which has its own lockfile.
  // Pin the workspace root so Turbopack doesn't get confused by the parent.
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
  },
};

export default nextConfig;
