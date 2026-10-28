import {
  createGoogleBooksProvider,
  createOpenLibraryProvider,
  createProjectGutenbergProvider,
  type MetadataProvider,
} from "@prose-reader/metadata-fetcher"

const CATALOG_USER_AGENT = "oboku (+https://github.com/mbret/oboku)"

const CATALOG_REQUEST_TIMEOUT_MS = 15_000

/**
 * Gives each request a catalog makes its own deadline, so a catalog that
 * hangs fails alone: aborting the signal passed to `fetchMetadata` would
 * reject the whole lookup.
 */
const fetchWithTimeout: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    signal: AbortSignal.timeout(CATALOG_REQUEST_TIMEOUT_MS),
  })

/** Their order breaks ties between equally scored matches. */
export const createCatalogProviders = ({
  googleApiKey,
  googleBooksBaseUrl,
}: {
  googleApiKey: string | undefined
  googleBooksBaseUrl: string
}): MetadataProvider[] => [
  createProjectGutenbergProvider({
    userAgent: CATALOG_USER_AGENT,
    fetch: fetchWithTimeout,
  }),
  ...(googleApiKey?.trim()
    ? [
        createGoogleBooksProvider({
          apiKey: googleApiKey,
          baseUrl: googleBooksBaseUrl,
          fetch: fetchWithTimeout,
        }),
      ]
    : []),
  createOpenLibraryProvider({
    userAgent: CATALOG_USER_AGENT,
    fetch: fetchWithTimeout,
  }),
]
