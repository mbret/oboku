import axios, { isAxiosError } from "axios"
import type { Item } from "./types"
import { performWithBackoff } from "../utils"
import { AppConfigService } from "src/config/AppConfigService"

export type GoogleBooksApiVolumesResponseData = {
  kind: `books#volumes` | `unknown`
  totalItems: number
  items?: Item[] // does not exist when totalItems is 0
}

export type GoogleBooksApiVolumeResponseData = Item

/**
 * Predicate for {@link performWithBackoff} that captures every error
 * worth retrying against the Google Books API:
 *
 *  - `429 Too Many Requests`: rate-limited, will pass after a backoff.
 *  - `5xx` server errors: Google's infrastructure hiccups (e.g. 503
 *    `backendFailed`, 502 `Bad Gateway`, 504 `Gateway Timeout`). These
 *    are transient by definition and routinely succeed on retry.
 *  - Network-level errors (no `response` because the request never
 *    completed): DNS blips, socket resets, connect timeouts.
 *
 * Anything 4xx other than 429 (bad query, missing key, etc.) is
 * deterministic and NOT retried — repeating the same request would just
 * burn rate-limit budget for the same failure.
 */
const isRetryableGoogleBooksError = (error: unknown): boolean => {
  if (!isAxiosError(error)) return false

  const status = error.response?.status

  // Network failure / no response received — typically transient.
  if (status === undefined) return true

  return status === 429 || status >= 500
}

/**
 * Supports formats like: [9782413023470, 978-1-947804-36-4]
 */
export const findByISBN = async (
  isbn: string,
  apiKey: string,
  config: AppConfigService,
) => {
  const url = `${config.config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`

  console.log("[google] [findByISBN]", { url })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumesResponseData>(url),
    retry: isRetryableGoogleBooksError,
  })

  if (response.status === 200) {
    // Logger.info(`google findByISBN response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findByTitle = async (
  name: string,
  apiKey: string,
  config: AppConfigService,
) => {
  const cleanedName = encodeURIComponent(name)
  const uri = `${config.config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=intitle:${cleanedName}&key=${apiKey}`

  console.log("[google] [findByTitle]", { uri })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumesResponseData>(uri),
    retry: isRetryableGoogleBooksError,
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findByVolumeId = async (
  name: string,
  apiKey: string,
  config: AppConfigService,
) => {
  const uri = `${config.config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes/${encodeURIComponent(name)}?key=${apiKey}`

  console.log("[google] [findByVolumeId]", { uri })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumeResponseData>(uri),
    retry: isRetryableGoogleBooksError,
  })

  if (response.status === 200) {
    return {
      items: [response.data],
    }
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findSeriesByTitle = async (
  name: string,
  apiKey: string,
  config: AppConfigService,
) => {
  const response = await performWithBackoff({
    asyncFunction: () =>
      axios.get<GoogleBooksApiVolumesResponseData>(
        `${config.config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=intitle:${name}&key=${apiKey}`,
      ),
    retry: isRetryableGoogleBooksError,
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}
