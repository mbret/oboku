export const sourceLocale = "en"

export const supportedLocales = [sourceLocale, "fr"] as const

export type SupportedLocale = (typeof supportedLocales)[number]

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.some(function isSameLocale(supportedLocale) {
    return supportedLocale === locale
  })
}

/**
 * Returns the first supported locale among `languages`, BCP 47 tags in order
 * of preference such as `navigator.languages`, ignoring their region.
 * Returns the source locale when none is supported.
 */
export function pickSupportedLocale(
  languages: readonly string[],
): SupportedLocale {
  const baseLanguages = languages.map(
    (language) => new Intl.Locale(language).language,
  )

  return baseLanguages.find(isSupportedLocale) ?? sourceLocale
}
