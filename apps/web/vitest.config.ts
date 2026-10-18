import { defineConfig, mergeConfig } from "vitest/config"
import { headlessChromium } from "../../config/vitest.browser.ts"
import viteConfig from "./vite.config.ts"

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      browser: headlessChromium,
    },
  }),
)
