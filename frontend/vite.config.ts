import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Version anchor for release evidence (10/10 mainnet). Build with: VITE_APP_VERSION=x.y.z npm run build
const appVersion =
  process.env.VITE_APP_VERSION ||
  process.env.GIT_DESCRIBE ||
  (typeof process.env.CI !== "undefined" ? "ci" : "dev");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
});
