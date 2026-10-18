import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const browserTestFiles = "src/**/*.browser.test.ts"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          include: ["src/**/*.test.ts"],
          exclude: [browserTestFiles],
        },
      },
      {
        test: {
          name: "browser",
          include: [browserTestFiles],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
})
