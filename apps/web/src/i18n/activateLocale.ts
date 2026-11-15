import { i18n, type Messages } from "@lingui/core"
import type { SupportedLocale } from "./supportedLocales"

const catalogLoaders = {
  en: function loadEnglishCatalog() {
    return import("./locales/en.po")
  },
  fr: function loadFrenchCatalog() {
    return import("./locales/fr.po")
  },
} satisfies Record<SupportedLocale, () => Promise<{ messages: Messages }>>

export async function activateLocale(locale: SupportedLocale) {
  const { messages } = await catalogLoaders[locale]()

  i18n.loadAndActivate({ locale, messages })
  document.documentElement.lang = locale
}
