import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests: npm run test:e2e. Each run builds the app and starts it on a fresh, seeded database in e2e/.tmp
 * with a test passcode, so local.db and your real passcode are never used.
 */
const PORT = 3124;

export default defineConfig({
  testDir: "e2e",
  // the flows share one database, so they run in order, one at a time
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "login", testMatch: /login\.setup\.ts/ },
    {
      name: "desktop",
      testIgnore: /lockout\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, storageState: "e2e/.tmp/session.json" },
      dependencies: ["login"],
    },
    // phones only run the page checks; the flows are the same code at any width
    {
      name: "phone",
      testMatch: /pages\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: "e2e/.tmp/session.json" },
      dependencies: ["desktop"],
    },
    { name: "lockout", testMatch: /lockout\.spec\.ts/, use: { ...devices["Desktop Chrome"] }, dependencies: ["phone"] },
  ],
  webServer: {
    command: "bash e2e/start.sh",
    url: `http://localhost:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      DATABASE_URL: "file:e2e/.tmp/test.db",
      DATABASE_AUTH_TOKEN: "",
      APP_PASSWORD: "e2e-passcode",
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      LANES_CLI_TOKEN: "",
      LANES_BACKUP: "off",
    },
  },
});
