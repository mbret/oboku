import { i18n } from "@lingui/core"
import {
  isSupportedLocale,
  sourceLocale,
  type SupportedLocale,
} from "./supportedLocales"

export function getBrowserLocale(): SupportedLocale {
  const browserLanguages = navigator.languages.map(
    (language) => new Intl.Locale(language).language,
  )

  return browserLanguages.find(isSupportedLocale) ?? sourceLocale
}

export async function activateLocale(locale: SupportedLocale) {
  const { messages } = await import(`./locales/${locale}.po`)

  i18n.loadAndActivate({ locale, messages })
}
