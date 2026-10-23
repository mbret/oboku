import {
  type BookDocType,
  type BookMetadata,
  directives,
  getBookMetadataFields,
  getBookMetadataSource,
  getOrderedBookMetadataSources,
  LEGACY_CATALOG_SOURCE_NAME,
} from "@oboku/shared"
import { isIdentityConfirmed } from "./isIdentityConfirmed.js"

/**
 * Whether a legacy catalog entry describes *this* book rather than a
 * plausible neighbour: whether its lookup addressed one Google Books volume
 * id, which the link's directive or the file gives. A catalog match states
 * it itself ({@link isIdentityConfirmed}).
 */
const isLegacyCatalogIdentityConfirmed = (
  metadataList: ReadonlyArray<BookMetadata>,
) => {
  const linkTitle = metadataList.find((entry) => entry.type === "link")?.title
  const fileEntry = metadataList.find((entry) => entry.type === "file")
  const googleVolumeId =
    directives.extractDirectivesFromName(linkTitle ?? "").googleVolumeId ??
    (fileEntry ? getBookMetadataFields(fileEntry).googleVolumeId : undefined)

  return googleVolumeId !== undefined
}

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
  isLegacyCatalogConfirmed: boolean,
): boolean => {
  const { coverLink, coverConfidence } = getBookMetadataFields(metadata)

  if (!coverLink) return false

  switch (metadata.type) {
    case "catalog":
      return isIdentityConfirmed(metadata)
    case LEGACY_CATALOG_SOURCE_NAME:
      return isLegacyCatalogConfirmed
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
): BookMetadata | undefined => {
  if (!metadataList?.length) return undefined

  const isLegacyCatalogConfirmed =
    isLegacyCatalogIdentityConfirmed(metadataList)

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
      return isCertainCover(metadata, isLegacyCatalogConfirmed)
    }) ?? highestPriorityCover(hasCover)
  )
}
