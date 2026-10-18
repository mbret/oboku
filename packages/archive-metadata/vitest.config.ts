import { defineConfig } from "vitest/config"
import { headlessChromium } from "../../config/vitest.browser.ts"

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
          browser: headlessChromium,
        },
      },
    ],
  },
})
