import type { ResolvedMetadata } from "@prose-reader/archive-reader"
import type { MetadataMatch } from "@prose-reader/metadata-fetcher"
import {
  LEGACY_CATALOG_SOURCE_NAME,
  type LegacyFileMetadata,
  type LegacyGoogleBookApiMetadata,
  toCurrentBookMetadataSourceName,
} from "./legacy"

export * from "./fields"
export * from "./legacy"

/**
 * Every property a book's metadata can show, whichever source it comes
 * from: what {@link getBookMetadataFields} reads out of any entry, and the
 * shape of the **merged** view consumers build from those by priority (e.g.
 * `getMetadataFromBook`), where any field may be present regardless of the
 * source that supplied it.
 *
 * The flat variants ({@link LinkMetadata}, {@link UserMetadata}) store these
 * fields directly, each picking the subset it can advertise. Fields a
 * variant cannot advertise are typed as `?: never` so reads still compile
 * (yielding `undefined`) but writes are caught at compile time.
 */
export type BookMetadataFields = {
  title?: string | number
  authors?: string[]
  description?: string
  formatType?: ("book" | "comics" | "manga" | "audio")[]
  rating?: number
  coverLink?: string
  /**
   * How {@link coverLink} was determined, in archive-reader's vocabulary:
   * `derived` when the container names the image as its cover, `assumed`
   * when it names none and this is its first page. Only the `file` source
   * can answer it, and only for a cover it actually reports; absent means
   * "not known", never "not derived".
   */
  coverConfidence?: "derived" | "assumed"
  pageCount?: number
  contentType?: string
  date?: { year?: number; month?: number; day?: number }
  /** Stored as a string because some providers already expose byte size as text. */
  size?: string
  languages?: string[]
  subjects?: string[]
  isbn?: string
  publisher?: string | undefined
  rights?: string | undefined
  googleVolumeId?: string | undefined
  /**
   * Provider-reported file modification timestamp (ISO 8601). Only the
   * `link` source can advertise it — it describes the linked resource on
   * the storage provider, not the merged book. Used as a cheap fingerprint
   * to skip re-downloading the file when its metadata is still valid.
   * Plugins MUST return the provider's real timestamp here, or omit the
   * field entirely; never substitute a synthetic `Date.now()` value, which
   * would defeat the cache.
   */
  modifiedAt?: string
}

export type BookMetadataField = keyof BookMetadataFields

export type BookMetadataVariant<
  TType extends string,
  TKeys extends BookMetadataField,
> = { type: TType } & Pick<BookMetadataFields, TKeys> & {
    [K in Exclude<BookMetadataField, TKeys>]?: never
  }

/**
 * What the book's file says about it, as archive-reader's `resolveArchive`
 * reads it from the container (EPUB OPF, ComicInfo, …). `contentType` is
 * the file's own, which the container does not describe.
 */
export type FileMetadata = {
  type: "file"
  contentType?: string
  metadata: ResolvedMetadata
}

/**
 * The online catalog record matched to the book: the best accepted match
 * `@prose-reader/metadata-fetcher` returned, kept as it returns it minus the
 * provider's raw record. `version` is the schema version of the fetch that
 * produced it.
 */
export type CatalogMetadata = { type: "catalog"; version: number } & Omit<
  MetadataMatch,
  "raw"
>

/**
 * Metadata exposed by the storage provider for the link, before/without
 * downloading the file. Different providers populate different subsets,
 * but the shape is shared (e.g. Dropbox/Drive add `size`, all derive
 * `title` from the filename).
 *
 * Filename directives (`[oboku~isbn~…]`, `[oboku~google-volume-id~…]`,
 * …) are NOT stored as separate fields — they live in `title` and are
 * parsed on demand, so renaming the file in the provider remains the
 * single source of truth.
 */
export type LinkMetadata = BookMetadataVariant<
  "link",
  "title" | "contentType" | "size" | "modifiedAt"
> & { title?: string }

/**
 * Metadata supplied directly by the end user. Currently only ISBN is
 * exposed for editing; expand the variant as new fields become editable.
 */
export type UserMetadata = BookMetadataVariant<"user", "isbn">

export type BookMetadata =
  | FileMetadata
  | CatalogMetadata
  | LinkMetadata
  | UserMetadata
  | LegacyFileMetadata
  | LegacyGoogleBookApiMetadata

/**
 * Canonical set of metadata sources whose relative priority can be
 * reordered by the user. `user` is pinned to the highest priority and
 * `link` to the lowest, so they are intentionally excluded.
 *
 * Single source of truth for the reorderable subset:
 *  - {@link ReorderableBookMetadataSource} is derived from this list
 *  - {@link BookDocType.metadataSourcePriority} references that type
 *  - {@link DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES} aliases this
 *    constant for the default fill order
 *
 * Adding a new reorderable source therefore requires editing exactly
 * this array — type, persistence shape, and runtime checks all follow.
 */
export const REORDERABLE_BOOK_METADATA_SOURCES = ["file", "catalog"] as const

export type ReorderableBookMetadataSource =
  (typeof REORDERABLE_BOOK_METADATA_SOURCES)[number]

/**
 * Default merge/display order for the reorderable middle of the
 * priority list, used when the user has not customized it. Identical
 * to {@link REORDERABLE_BOOK_METADATA_SOURCES} on purpose: declaration
 * order doubles as the default order.
 */
export const DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES: ReadonlyArray<ReorderableBookMetadataSource> =
  REORDERABLE_BOOK_METADATA_SOURCES

export const isReorderableBookMetadataSource = (
  value: string,
): value is ReorderableBookMetadataSource =>
  (REORDERABLE_BOOK_METADATA_SOURCES as ReadonlyArray<string>).includes(value)

/**
 * Every source a book's metadata can come from — also the rows of the
 * user-facing priority pane. Each entry of `book.metadata` belongs to one:
 * see {@link getBookMetadataSource}.
 */
export type BookMetadataSource = Exclude<
  BookMetadata["type"],
  typeof LEGACY_CATALOG_SOURCE_NAME
>

export const getBookMetadataSource = ({
  type,
}: Pick<BookMetadata, "type">): BookMetadataSource =>
  type === LEGACY_CATALOG_SOURCE_NAME ? "catalog" : type

/** A catalog entry, in either stored shape. */
export const isCatalogEntry = (entry: BookMetadata) =>
  entry.type === "catalog" || entry.type === LEGACY_CATALOG_SOURCE_NAME

/**
 * Builds the full, ordered list of metadata sources from the user-defined
 * middle. Returned highest → lowest priority — i.e. both the order
 * rendered in the UI and the order from which the merge / cover-pick
 * derives its precedence.
 *
 * Defends against malformed persisted values by:
 *  - stripping anything that isn't a reorderable source (no `user`/`link`
 *    sneaking into the middle)
 *  - de-duplicating the input while preserving first occurrence, so a
 *    persisted `['file','file']` doesn't surface the same source twice
 *  - re-adding any reorderable source missing from the input, preserving
 *    the default relative order, so the result always covers every source
 *    exactly once.
 *
 * `user` is pinned at the highest priority and `link` at the lowest, so
 * only the reorderable middle is configurable by the user.
 */
export const getOrderedBookMetadataSources = (
  middle: ReadonlyArray<string> | undefined,
): BookMetadataSource[] => {
  const ordered = new Set<ReorderableBookMetadataSource>(
    (middle ?? [])
      .map(toCurrentBookMetadataSourceName)
      .filter(isReorderableBookMetadataSource),
  )
  for (const source of DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES) {
    ordered.add(source)
  }

  return ["user", ...ordered, "link"]
}

export const BOOK_METADATA_SOURCES: BookMetadataSource[] =
  getOrderedBookMetadataSources(undefined)

export const isBookMetadataSource = (
  value: string | undefined,
): value is BookMetadataSource =>
  // Widen the array element type to `string` rather than narrowing `value`
  // to `BookMetadataSource`, so the runtime guard does the type narrowing
  // and we don't lie about the input type.
  value !== undefined &&
  (BOOK_METADATA_SOURCES as ReadonlyArray<string>).includes(value)

/**
 * The display fields each source can show, in the order the sources pane
 * previews them.
 */
export const BOOK_METADATA_FIELDS_BY_SOURCE = {
  catalog: [
    "title",
    "authors",
    "description",
    "formatType",
    "rating",
    "coverLink",
    "pageCount",
    "date",
    "publisher",
    "languages",
    "subjects",
  ],
  file: [
    "title",
    "authors",
    "description",
    "publisher",
    "rights",
    "languages",
    "date",
    "subjects",
    "coverLink",
    "pageCount",
    "contentType",
    "isbn",
  ],
  link: ["title", "contentType", "size", "modifiedAt"],
  user: ["isbn"],
} as const satisfies Record<BookMetadataSource, readonly BookMetadataField[]>

export type CollectionMetadata = {
  title?:
    | string
    | {
        en?: string
        es?: string
        ru?: string
        "ja-ro"?: string
      }
  aliases?: string[]
  authors?: string[]
  description?: string
  numberOfIssues?: number
  // biome-ignore lint/complexity/noBannedTypes: TODO
  firstIssue?: {}
  startYear?: number
  publisherName?: string
  rating?: number | null
  cover?: {
    uri: string
    createdAt?: string
    updatedAt?: string
  }
  status?: "completed" | "ongoing" | "unknown"
  /**
   * googleBookApi: Metadata scrapped through google book api
   * link: metadata scrapped from the current link
   * user: metadata from user
   *
   * See `COLLECTION_METADATA_PRIORITY` for how sources override each other.
   */
  type:
    | "googleBookApi"
    | "link"
    | "user"
    | "biblioreads"
    | "comicvine"
    | "mangaupdates"
    | "mangadex"
}

export const COLLECTION_METADATA_LOCK_MN = 5
