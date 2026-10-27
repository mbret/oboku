import { playwright } from "@vitest/browser-playwright"
import type { BrowserConfigOptions } from "vitest/node"

/** `test.browser` options for projects whose tests run in Chromium instead of Node. */
export const headlessChromium = {
  enabled: true,
  headless: true,
  screenshotFailures: false,
  provider: playwright(),
  instances: [{ browser: "chromium" }],
} satisfies BrowserConfigOptions
