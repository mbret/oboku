/* eslint-disable no-restricted-globals */
import { isMobileDetected } from "./common/utils"

// @ts-ignore
const sw: ServiceWorkerGlobalScope = self as any
const hostname =
  typeof window === "object"
    ? window?.location?.hostname
    : sw?.location?.hostname

export const API_URI = import.meta.env.VITE_API_URL || `/api/dev`
export const API_COUCH_URI =
  import.meta.env.VITE_API_COUCH_URI || `https://${hostname}:4003`

export const IS_MOBILE_DEVICE = isMobileDetected()

export const ROUTES = {
  HOME: "/",
  BOOK_DETAILS: "/book/:id",
  COLLECTION_DETAILS: "/collection/:id",
  PROFILE: "/profile",
  SETTINGS: "/profile/settings",
  STATISTICS: "/profile/statistics",
  DATASOURCES: "/datasources",
  LIBRARY_ROOT: "/library",
  LIBRARY_BOOKS: "/library/books",
  LIBRARY_COLLECTIONS: "/library/collections",
  LIBRARY_TAGS: "/library/tags",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth_callback",
  READER: "/reader/:id",
  SEARCH: "/search",
  PROBLEMS: "/problems"
} as const

export const READER_NOTIFICATION_TIME_TO_SCREEN = 2000
export const READER_NOTIFICATION_THROTTLE_TIME = 300
