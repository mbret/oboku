import type {
  CatalogMetadata,
  LegacyGoogleBookApiMetadata,
} from "@oboku/shared"
import type { FetchedMetadata } from "@prose-reader/metadata-fetcher"
import { isIdentityConfirmed } from "./isIdentityConfirmed.js"

export type StoredCatalogEntry = CatalogMetadata | LegacyGoogleBookApiMetadata

/**
 * While a catalog fails, the previous entry stays: "nothing matched" is only
 * an answer when every catalog answered. A match only replaces it when an
 * identifier confirms it, so an outage does not swap a confirmed record for a
 * weaker one from another catalog and back.
 */
export const nextCatalogEntry = (
  fetched: FetchedMetadata,
  previous: StoredCatalogEntry | undefined,
): StoredCatalogEntry | undefined => {
  const match = fetched.matches.find(({ accepted }) => accepted)
  const isAnyCatalogFailing = fetched.failedProviders.length > 0

  if (!match) return isAnyCatalogFailing ? previous : undefined

  const isUnconfirmedMatchDuringOutage =
    isAnyCatalogFailing && previous !== undefined && !isIdentityConfirmed(match)

  if (isUnconfirmedMatchDuringOutage) return previous

  const { raw: _, ...matchWithoutRaw } = match

  return { type: "catalog", version: fetched.version, ...matchWithoutRaw }
}
