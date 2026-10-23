import { Logger } from "@nestjs/common"
import {
  type FailedMetadataProvider,
  type FetchMetadataInput,
  fetchMetadata,
  hasSearchTerms,
  type MetadataProvider,
} from "@prose-reader/metadata-fetcher"
import {
  nextCatalogEntry,
  type StoredCatalogEntry,
} from "./nextCatalogEntry.js"

const logger = new Logger("refreshCatalogEntry")

const describeFailedProvider = ({ id, status }: FailedMetadataProvider) =>
  status === undefined ? id : `${id} (${status})`

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

  if (fetched.failedProviders.length > 0) {
    logger.warn(
      `Catalogs failed for ${bookId}: ${fetched.failedProviders.map(describeFailedProvider).join(", ")}`,
    )
  }

  return nextCatalogEntry(fetched, previous)
}
