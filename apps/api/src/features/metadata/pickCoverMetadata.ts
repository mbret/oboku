import {
  type BookDocType,
  type BookMetadata,
  type CatalogMetadata,
  getBookMetadataFields,
  getBookMetadataSource,
  getOrderedBookMetadataSources,
  LEGACY_CATALOG_SOURCE_NAME,
} from "@oboku/shared"

type CoverCertainty = {
  /**
   * Whether a legacy catalog entry describes *this* book rather than a
   * plausible neighbour: whether its lookup addressed one Google Books
   * volume id. A catalog match states it itself ({@link isIdentityConfirmed}).
   */
  catalogIdentityIsConfirmed?: boolean
}

const IDENTITY_MATCH_FIELDS: ReadonlyArray<
  CatalogMetadata["signals"][number]["field"]
> = ["isbn", "gtin", "identifiers"]

/**
 * Whether an identifier settled the match: metadata-fetcher pins the score
 * of a match to 1 when an ISBN, a GTIN or a scheme-scoped identifier agrees.
 */
export const isIdentityConfirmed = ({
  score,
  signals,
}: Pick<CatalogMetadata, "score" | "signals">) =>
  score === 1 &&
  signals.some(
    (signal) =>
      IDENTITY_MATCH_FIELDS.includes(signal.field) && signal.score === 1,
  )

/**
 * Whether the source is certain this image is *this book's* cover. Two
 * independent questions both have to answer yes, and each source can only
 * answer one of them for free:
 *
 *  - does the source describe this book? An archive *is* the book; a catalog
 *    is only as sure as its identity match.
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
  const { coverLink, coverConfidence } = getBookMetadataFields(metadata)

  if (!coverLink) return false

  switch (metadata.type) {
    case "catalog":
      return isIdentityConfirmed(metadata)
    case LEGACY_CATALOG_SOURCE_NAME:
      return catalogIdentityIsConfirmed === true
    case "file":
      return coverConfidence === "derived"
    default:
      return false
  }
}

const hasCover = (metadata: BookMetadata): boolean =>
  !!getBookMetadataFields(metadata).coverLink

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
        (metadata) =>
          getBookMetadataSource(metadata) === source && isEligible(metadata),
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
