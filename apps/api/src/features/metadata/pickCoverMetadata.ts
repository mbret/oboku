import {
  type BookDocType,
  type BookMetadata,
  getOrderedBookMetadataSources,
} from "@oboku/shared"

/**
 * Whether the source is certain this image is *this book's* cover, rather
 * than the best guess available:
 *
 *  - `googleBookApi` — only when the lookup was addressed by volume id. A
 *    volume id resolves to exactly one Google Books record, where an ISBN
 *    can match several printings and a title match nothing in particular.
 *  - `file` — only when the container names the image as its cover. A comic
 *    archive names none, so its cover is its first page by convention.
 *
 * Certainty must be asserted; an entry that does not answer is not certain.
 */
const statesTheBooksCover = (
  metadata: BookMetadata,
  googleVolumeId: string | undefined,
): boolean => {
  if (!metadata.coverLink) return false

  switch (metadata.type) {
    case "googleBookApi":
      return googleVolumeId !== undefined
    case "file":
      return metadata.coverIsDeclared === true
    default:
      return false
  }
}

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
  { googleVolumeId }: { googleVolumeId?: string | undefined } = {},
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
    highestPriorityCover(function statesIt(metadata) {
      return statesTheBooksCover(metadata, googleVolumeId)
    }) ??
    highestPriorityCover(function hasOne(metadata) {
      return !!metadata.coverLink
    })
  )
}
