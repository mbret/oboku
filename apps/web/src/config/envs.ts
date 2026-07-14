const resolveBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL

  const location = typeof window !== "undefined" ? window.location : undefined

  return location ? `${location.protocol}//${location.hostname}:3000` : ""
}

export const API_URL = resolveBaseApiUrl()

/**
 * Additional API origins. They serve the exact same API as VITE_API_URL and
 * default to it. They exist only to work around the browser's per-origin
 * HTTP/1 connection limit: live replication of several collections needs more
 * concurrent connections than a single origin allows, so it can be spread
 * across a few origins. Over HTTP/2 this limit is gone and these can stay
 * unset.
 *
 * They must share VITE_API_URL's hostname and differ only by port: connection
 * pools are scoped per origin (so a different port is enough to fan out), but
 * the httpOnly auth cookies are scoped per hostname (ports ignored) — an
 * alternate on a different hostname never receives them and every request to
 * it fails with a 401.
 */
export const API_URL_2 = import.meta.env.VITE_API_URL_2 || API_URL
export const API_URL_3 = import.meta.env.VITE_API_URL_3 || API_URL
export const API_URL_4 = import.meta.env.VITE_API_URL_4 || API_URL

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

export const findAlternatesNotSharingApiHostname = (
  apiUrl: string,
  alternateApiUrls: string[],
) => {
  const apiHostname = getHostname(apiUrl)

  if (!apiHostname) return []

  return [
    ...new Set(
      alternateApiUrls.filter((url) => getHostname(url) !== apiHostname),
    ),
  ]
}

const alternatesOutsideCookieScope = findAlternatesNotSharingApiHostname(
  API_URL,
  [API_URL_2, API_URL_3, API_URL_4],
)

if (alternatesOutsideCookieScope.length > 0) {
  console.error(
    `Alternate API origins [${alternatesOutsideCookieScope.join(", ")}] do not share the hostname of ${API_URL}. ` +
      `Auth cookies are host-scoped, so replication requests to them will fail with 401. ` +
      `VITE_API_URL_2/3/4 may only differ from VITE_API_URL by port.`,
  )
}

export const VITE_FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_CONFIG
export const STORAGE_PROFILE_KEY = `profile`
export const API_COUCH_URI = `${API_URL}/couchdb`
export const API_COUCH_URI_2 = `${API_URL_2}/couchdb`
export const API_COUCH_URI_3 = `${API_URL_3}/couchdb`
export const API_COUCH_URI_4 = `${API_URL_4}/couchdb`
