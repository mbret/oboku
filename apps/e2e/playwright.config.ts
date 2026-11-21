import { defineConfig, devices } from "@playwright/test"
import { WEB_URL } from "./src/stack"

const isCi = !!process.env.CI

export default defineConfig({
  forbidOnly: isCi,
  reporter: isCi
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
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
  ],
})
