import { defineConfig } from "@lingui/cli"
import { formatter } from "@lingui/format-po"
import { sourceLocale, supportedLocales } from "./src/i18n/supportedLocales.ts"

export default defineConfig({
  sourceLocale,
  locales: [...supportedLocales],
  catalogs: [
    {
      path: "<rootDir>/src/i18n/locales/{locale}",
      include: ["<rootDir>/src"],
    },
  ],
  format: formatter({ lineNumbers: false }),
})
