import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker (node .next/standalone/server.js).
  output: "standalone",
  // A stray package-lock.json in the user's home directory makes Next infer the
  // wrong workspace root. Pin tracing to this project (npm scripts run with the
  // project dir as cwd).
  outputFileTracingRoot: process.cwd(),
  // Не светим заголовок X-Powered-By.
  poweredByHeader: false,
  // ioredis грузим как нативный модуль (его динамические require ломаются при
  // бандлинге webpack'ом — иначе rate-limit тихо падает в in-memory фолбэк).
  serverExternalPackages: ["ioredis"],
  // Tree-shake барель-импорты тяжёлых пакетов (framer-motion живёт в layout-бандле
  // через ShunyaCompanion, иконки — на каждой странице).
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
