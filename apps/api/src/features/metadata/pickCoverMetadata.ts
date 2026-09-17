import {
  type BookDocType,
  type BookMetadata,
  getOrderedBookMetadataSources,
} from "@oboku/shared"

type CoverCertainty = {
  /**
   * Whether the catalog match describes *this* book rather than a plausible
   * neighbour. Today the lookup either addressed one Google Books volume id
   * or it searched; `@prose-reader/metadata-fetcher` states it as a 0–1
   * score that an agreeing ISBN, GTIN or shared identifier pins to 1.
   */
  catalogIdentityIsConfirmed?: boolean
}

/**
 * Whether the source is certain this image is *this book's* cover. Two
 * independent questions both have to answer yes, and each source can only
 * answer one of them for free:
 *
 *  - does the source describe this book? An archive *is* the book; a catalog
 *    is only as sure as its identity match ({@link CoverCertainty}).
 *  - does the source name this image as the cover? An archive answers with
 *    `coverConfidence`, `assumed` being the first page of a container that
 *    names none. A catalog's cover is always its own declaration.
 *
 * Certainty must be asserted, so a source that does not answer is not
 * certain.
 */
const isCertainCover = (
  metadata: BookMetadata,
  { catalogIdentityIsConfirmed }: CoverCertainty,
): boolean => {
  if (!metadata.coverLink) return false

  switch (metadata.type) {
    case "googleBookApi":
      return catalogIdentityIsConfirmed === true
    case "file":
      return metadata.coverConfidence === "derived"
    default:
      return false
  }
}

const hasCover = (metadata: BookMetadata): boolean => !!metadata.coverLink

/**
 * Picks the metadata entry that should provide the cover.
 *
 * Certainty outranks priority, and the user-defined source priority
 * persisted on the book (`metadataSourcePriority`) orders the sources
 * within each tier: a cover the source is certain about wins, and only
 * when no source is certain does the highest-priority guess apply.
 *
 * The priority itself is never reordered, so this stays consistent with
 * the merge precedence used on the web in {@link getMetadataFromBook} —
 * which needs no tier of its own, since a field is either stated or
 * absent.
 */
export const pickCoverMetadata = (
  metadataList: ReadonlyArray<BookMetadata> | undefined,
  priority: BookDocType["metadataSourcePriority"],
  certainty: CoverCertainty = {},
): BookMetadata | undefined => {
  if (!metadataList?.length) return undefined

  const orderedSources = getOrderedBookMetadataSources(priority)

  const highestPriorityCover = (
    isEligible: (metadata: BookMetadata) => boolean,
  ) => {
    for (const source of orderedSources) {
      const match = metadataList.find(
        (metadata) => metadata.type === source && isEligible(metadata),
      )

      if (match) return match
    }

    return undefined
  }

  return (
    highestPriorityCover(function isCertain(metadata) {
      return isCertainCover(metadata, certainty)
    }) ?? highestPriorityCover(hasCover)
  )
}
