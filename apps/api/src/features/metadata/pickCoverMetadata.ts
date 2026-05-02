import {
  type BookDocType,
  type BookMetadata,
  getOrderedBookMetadataSources,
} from "@oboku/shared"

/**
 * Picks the metadata entry that should provide the cover, honoring the
 * user-defined source priority persisted on the book
 * (`metadataSourcePriority`). Sources are walked highest → lowest
 * priority; the first entry that actually carries a `coverLink` wins.
 *
 * Mirrors the merge precedence used on the web in
 * {@link getMetadataFromBook} so the cached cover image stays consistent
 * with the metadata fields surfaced in the UI.
 */
export const pickCoverMetadata = (
  metadataList: ReadonlyArray<BookMetadata> | undefined,
  priority: BookDocType["metadataSourcePriority"],
): BookMetadata | undefined => {
  if (!metadataList?.length) return undefined

  const orderedSources = getOrderedBookMetadataSources(priority)

  for (const source of orderedSources) {
    const match = metadataList.find(
      (metadata) => metadata.type === source && metadata.coverLink,
    )

    if (match) return match
  }

  return undefined
}
