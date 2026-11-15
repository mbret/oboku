export const sourceLocale = "en"

export const supportedLocales = [sourceLocale, "fr"] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.some(function isSameLocale(supportedLocale) {
    return supportedLocale === locale
  })
}
