import type {
  CatalogMetadata,
  LegacyGoogleBookApiMetadata,
} from "@oboku/shared"
import type { FetchedMetadata } from "@prose-reader/metadata-fetcher"
import { isIdentityConfirmed } from "./pickCoverMetadata.js"

type StoredCatalogEntry = CatalogMetadata | LegacyGoogleBookApiMetadata

/**
 * The catalog entry a refresh stores, from what the lookup returned
 * (`undefined` when the book gave nothing to search on).
 *
 * - The first accepted match replaces the previous entry.
 * - While a catalog fails, the previous entry stays: "nothing matched" is
 *   only an answer when every catalog answered. A match only replaces it
 *   when an identifier confirms it, so an outage does not swap a confirmed
 *   record for a weaker one from another catalog and back.
 */
export const nextCatalogEntry = (
  fetched: FetchedMetadata | undefined,
  previous: StoredCatalogEntry | undefined,
): StoredCatalogEntry | undefined => {
  if (!fetched) return undefined

  const match = fetched.matches.find(({ accepted }) => accepted)
  const isAnyCatalogFailing = fetched.failedProviders.length > 0

  if (!match) return isAnyCatalogFailing ? previous : undefined

  const isWeakerThanPreviousDuringOutage =
    isAnyCatalogFailing && previous !== undefined && !isIdentityConfirmed(match)

  if (isWeakerThanPreviousDuringOutage) return previous

  const { raw: _, ...matchWithoutRaw } = match

  return { type: "catalog", version: fetched.version, ...matchWithoutRaw }
}
