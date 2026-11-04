import { Logger } from "@nestjs/common"
import {
  type FailedMetadataProvider,
  type FetchedMetadata,
  type FetchMetadataInput,
  fetchMetadata,
  hasSearchTerms,
  type MetadataProvider,
} from "@prose-reader/metadata-fetcher"
import {
  isCatalogOutage,
  nextCatalogEntry,
  type StoredCatalogEntry,
} from "./nextCatalogEntry.js"

const logger = new Logger("refreshCatalogEntry")

const describeFailedProviders = (
  failedProviders: ReadonlyArray<FailedMetadataProvider>,
) =>
  failedProviders
    .map(({ id, status }) => (status === undefined ? id : `${id} (${status})`))
    .join(", ")

const logFailedCatalogs = (
  bookId: string,
  { failedProviders }: FetchedMetadata,
) => {
  const outages = failedProviders.filter(isCatalogOutage)
  const refusals = failedProviders.filter((failed) => !isCatalogOutage(failed))

  if (outages.length > 0) {
    logger.warn(
      `Catalogs down for ${bookId}: ${describeFailedProviders(outages)}`,
    )
  }

  if (refusals.length > 0) {
    logger.error(
      `Catalogs refused the lookup for ${bookId}: ${describeFailedProviders(refusals)}`,
    )
  }
}

/** The catalog entry a book refresh stores, after asking the catalogs. */
export const refreshCatalogEntry = async ({
  bookId,
  lookupInput,
  previous,
  providers,
}: {
  bookId: string
  lookupInput: FetchMetadataInput
  previous: StoredCatalogEntry | undefined
  providers: ReadonlyArray<MetadataProvider>
}): Promise<StoredCatalogEntry | undefined> => {
  if (!hasSearchTerms(lookupInput)) return undefined

  const fetched = await fetchMetadata(lookupInput, { providers })

  logFailedCatalogs(bookId, fetched)

  return nextCatalogEntry(fetched, previous)
}
