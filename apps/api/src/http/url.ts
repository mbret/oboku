const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i

export const hasUrlScheme = (url: string) => URL_SCHEME_PATTERN.test(url)

export const parseUrl = (url: string): URL | undefined => {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}
