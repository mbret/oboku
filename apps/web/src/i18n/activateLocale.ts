import { i18n, type Messages } from "@lingui/core"
import { pickSupportedLocale, type SupportedLocale } from "./supportedLocales"

const catalogLoaders = {
  en: () => import("./locales/en.po"),
  fr: () => import("./locales/fr.po"),
} satisfies Record<SupportedLocale, () => Promise<{ messages: Messages }>>

export function getBrowserLocale() {
  return pickSupportedLocale(navigator.languages)
}

export async function activateLocale(locale: SupportedLocale) {
  const { messages } = await catalogLoaders[locale]()

  i18n.loadAndActivate({ locale, messages })
  document.documentElement.lang = locale
}
