/* eslint-disable no-restricted-globals */
import { isMobileDetected } from "./common/utils"

// @ts-ignore
const sw: ServiceWorkerGlobalScope = self as any
const hostname =
  typeof window === "object"
    ? window?.location?.hostname
    : sw?.location?.hostname

export { API_URL, API_COUCH_URI } from "./constants.shared"

export const IS_MOBILE_DEVICE = isMobileDetected()

export const ROUTES = {
  HOME: "/",
  BOOK_DETAILS: "/book/:id",
  COLLECTION_DETAILS: "/collection/:id",
  PROFILE: "/profile",
  SETTINGS: "/profile/settings",
  STATISTICS: "/profile/statistics",
  DATASOURCES: "/sync",
  DATASOURCES_LIST: "/sync/datasources",
  DATASOURCES_REPORTS: "/sync/reports",
  LIBRARY_ROOT: "/library",
  LIBRARY_BOOKS: "/library/books",
  LIBRARY_COLLECTIONS: "/library/collections",
  LIBRARY_SERIES: "/library/series",
  LIBRARY_TAGS: "/library/tags",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth_callback",
  READER: "/reader/:id",
  SEARCH: "/search",
  PROBLEMS: "/problems"
} as const

export const READER_NOTIFICATION_TIME_TO_SCREEN = 2000
export const READER_NOTIFICATION_THROTTLE_TIME = 300
