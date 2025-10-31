import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./src/__tests__/setup.ts"],

    // Global test settings
    globals: true,

    // Coverage configuration with 80% threshold
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/__tests__/",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "src/env.d.ts",
        "src/db/database.types.ts",
        ".astro/",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Include test patterns
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    // Test timeout
    testTimeout: 10000,
  },

  // Resolve aliases to match tsconfig.json
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
