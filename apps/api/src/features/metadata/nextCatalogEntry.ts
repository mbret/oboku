import type {
  CatalogMetadata,
  LegacyGoogleBookApiMetadata,
} from "@oboku/shared"
import type {
  FailedMetadataProvider,
  FetchedMetadata,
} from "@prose-reader/metadata-fetcher"
import { isIdentityConfirmed } from "./isIdentityConfirmed.js"

export type StoredCatalogEntry = CatalogMetadata | LegacyGoogleBookApiMetadata

/**
 * No answer, a rate limit or a server error: the catalog may answer the same
 * request later. Any other refusal, such as a 403 for a key without the Books
 * API, repeats on every request.
 */
export const isCatalogOutage = ({ status }: FailedMetadataProvider) =>
  status === undefined || status === 429 || status >= 500

/**
 * While a catalog is down, the previous entry stays: "nothing matched" is only
 * an answer when no catalog is down. A match only replaces it when an
 * identifier confirms it, so an outage does not swap a confirmed record for a
 * weaker one from another catalog and back.
 */
export const nextCatalogEntry = (
  fetched: FetchedMetadata,
  previous: StoredCatalogEntry | undefined,
): StoredCatalogEntry | undefined => {
  const match = fetched.matches.find(({ accepted }) => accepted)
  const isAnyCatalogDown = fetched.failedProviders.some(isCatalogOutage)

  if (!match) return isAnyCatalogDown ? previous : undefined

  const isUnconfirmedMatchDuringOutage =
    isAnyCatalogDown && previous !== undefined && !isIdentityConfirmed(match)

  if (isUnconfirmedMatchDuringOutage) return previous

  const { raw: _, ...matchWithoutRaw } = match

  return { type: "catalog", version: fetched.version, ...matchWithoutRaw }
}
