import { defineConfig, devices } from "@playwright/test";

const isolatedTestClient = `198.51.100.${(process.pid % 200) + 1}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 90_000,
  expect: { timeout: 35_000, toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [{
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      extraHTTPHeaders: { "x-forwarded-for": isolatedTestClient },
    },
  }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: { ENABLE_LOCAL_CAPTURE_FOR_TESTS: "true" },
    timeout: 120_000,
  },
});
