// @ts-ignore
const sw: ServiceWorkerGlobalScope = self as any
const hostname =
  typeof window === "object"
    ? window?.location?.hostname
    : sw?.location?.hostname

export const STREAMER_URL_PREFIX = `streamer`
export const DOWNLOAD_PREFIX = `book-download`
export const SENTRY_DSN = `https://0d7a61df8dba4122be660fcc1161bf49@o490447.ingest.sentry.io/5554285`
export const SEARCH_MAX_PREVIEW_ITEMS = 8
export const STORAGE_PROFILE_KEY = `profile`
export const COLLECTION_EMPTY_ID = `oboku_dangling_books`
export const API_URL =
  import.meta.env.VITE_API_URL || `http://localhost:5173/api/dev`
export const API_COUCH_URI =
  import.meta.env.VITE_API_COUCH_URI || `https://${hostname}:4003`
export const CLEANUP_DANGLING_LINKS_INTERVAL = 1000 * 60 * 10 // 10mn
