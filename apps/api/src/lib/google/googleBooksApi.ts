import axios, { isAxiosError } from "axios"
import type { Item } from "./types.js"
import { performWithBackoff } from "../utils.js"
import { AppConfigService } from "../../config/AppConfigService.js"

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

const requestGoogleBooks = async <Data>({
  finder,
  path,
  config,
}: {
  finder: string
  path: string
  config: AppConfigService
}) => {
  const url = `${config.config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}${path}`

  console.log(`[google] [${finder}]`, { url })

  const response = await performWithBackoff({
    asyncFunction: function getFromGoogleBooks() {
      return axios.get<Data>(url)
    },
    retry: isRetryableGoogleBooksError,
  })

  if (response.status === 200) return response.data

  throw new Error(`An error occurred during ${finder}`)
}

/**
 * Supports formats like: [9782413023470, 978-1-947804-36-4]
 */
export const findByISBN = (
  isbn: string,
  apiKey: string,
  config: AppConfigService,
) =>
  requestGoogleBooks<GoogleBooksApiVolumesResponseData>({
    finder: "findByISBN",
    path: `/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`,
    config,
  })

export const findByTitle = (
  title: string,
  apiKey: string,
  config: AppConfigService,
) =>
  requestGoogleBooks<GoogleBooksApiVolumesResponseData>({
    finder: "findByTitle",
    path: `/volumes?q=intitle:${encodeURIComponent(title)}&key=${apiKey}`,
    config,
  })

export const findByVolumeId = async (
  volumeId: string,
  apiKey: string,
  config: AppConfigService,
) => {
  const volume = await requestGoogleBooks<GoogleBooksApiVolumeResponseData>({
    finder: "findByVolumeId",
    path: `/volumes/${encodeURIComponent(volumeId)}?key=${apiKey}`,
    config,
  })

  return { items: [volume] }
}
