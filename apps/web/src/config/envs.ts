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
 */
export const API_URL_2 = import.meta.env.VITE_API_URL_2 || API_URL
export const API_URL_3 = import.meta.env.VITE_API_URL_3 || API_URL
export const API_URL_4 = import.meta.env.VITE_API_URL_4 || API_URL

export const VITE_FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_CONFIG
export const STORAGE_PROFILE_KEY = `profile`
export const API_COUCH_URI = `${API_URL}/couchdb`
export const API_COUCH_URI_2 = `${API_URL_2}/couchdb`
export const API_COUCH_URI_3 = `${API_URL_3}/couchdb`
export const API_COUCH_URI_4 = `${API_URL_4}/couchdb`
