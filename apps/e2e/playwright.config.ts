import { defineConfig, devices } from "@playwright/test"
import { WEB_URL } from "./src/stack"

const isCi = !!process.env.CI

export default defineConfig({
  globalSetup: "./src/globalSetup.ts",
  forbidOnly: isCi,
  fullyParallel: true,
  expect: { timeout: 15_000 },
  reporter: [[isCi ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    actionTimeout: 15_000,
    baseURL: WEB_URL,
    locale: "en-US",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "smoke",
      testDir: "./tests/smoke",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "screenshots",
      testDir: "./tests/screenshots",
      use: { ...devices["Pixel 7"] },
    },
  ],
})
