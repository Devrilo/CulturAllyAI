import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env.test for E2E tests
dotenv.config({ path: ".env.test" });

/**
 * Playwright E2E Testing Configuration
 * Uses Chromium browser only as specified in requirements
 * Loads test environment from .env.test
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

  // Global teardown - clean up test data after all tests
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // Maximum time one test can run (including fixture setup time)
  // Increased to 90s to account for authenticatedPage fixture which takes ~60-70s
  timeout: 90 * 1000,

  // Run tests sequentially (1 worker) to avoid JWT token expiry issues and API rate limits
  // Tests with AI generation are slow and can cause session/token conflicts when run in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use 1 worker to run tests sequentially and prevent session conflicts
  workers: 1,

  // Reporter to use
  reporter: [["html"], ["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],

  // Shared settings for all projects
  use: {
    // Base URL for page.goto() calls - must be localhost:3000
    baseURL: "http://localhost:3000",

    // Collect trace on failure for debugging with trace viewer
    trace: "retain-on-failure",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for Chromium/Desktop Chrome only
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // Run local dev server before starting tests
  // Uses npm run dev:test which loads .env.test
  // In CI, .env.test is created dynamically from GitHub Secrets
  webServer: {
    command: "npm run dev:test",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
