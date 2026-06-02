import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory makes Next infer the
  // wrong workspace root. Pin tracing to this project (npm scripts run with the
  // project dir as cwd).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
