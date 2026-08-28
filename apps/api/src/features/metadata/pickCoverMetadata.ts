import {
  type BookDocType,
  type BookMetadata,
  getOrderedBookMetadataSources,
  type ReorderableBookMetadataSource,
} from "@oboku/shared"

/**
 * A Google volume id addresses exactly one Google Books record, where an ISBN
 * can match several printings — so a book that states one has already told us
 * which record it is, and that record's cover outranks the archive's whatever
 * the display priority says. What it outranks is usually a guess: a comic
 * archive declares no cover, so archive-reader reports its first page under
 * `confidence: "assumed"`.
 */
const STATED_GOOGLE_VOLUME_COVER_PRIORITY: ReorderableBookMetadataSource[] = [
  "googleBookApi",
  "file",
]

/**
 * Picks the metadata entry that should provide the cover, honoring the
 * user-defined source priority persisted on the book
 * (`metadataSourcePriority`). Sources are walked highest → lowest
 * priority; the first entry that actually carries a `coverLink` wins.
 *
 * Mirrors the merge precedence used on the web in
 * {@link getMetadataFromBook} so the cached cover image stays consistent
 * with the metadata fields surfaced in the UI — except when the book states
 * a Google volume id, see {@link STATED_GOOGLE_VOLUME_COVER_PRIORITY}.
 */
export const pickCoverMetadata = (
  metadataList: ReadonlyArray<BookMetadata> | undefined,
  priority: BookDocType["metadataSourcePriority"],
  { googleVolumeId }: { googleVolumeId?: string | undefined } = {},
): BookMetadata | undefined => {
  if (!metadataList?.length) return undefined

  const orderedSources = getOrderedBookMetadataSources(
    googleVolumeId ? STATED_GOOGLE_VOLUME_COVER_PRIORITY : priority,
  )

  for (const source of orderedSources) {
    const match = metadataList.find(
      (metadata) => metadata.type === source && metadata.coverLink,
    )

    if (match) return match
  }

  return undefined
}
