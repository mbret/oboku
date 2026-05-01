/**
 * Every property a book metadata entry can carry across all sources.
 *
 * This is the single source of truth for field shape. Each per-source
 * variant below picks the subset it can actually advertise. Fields not
 * supported by a given source are typed as `?: never` so reads still
 * compile (yielding `undefined`) but writes are caught at compile time.
 *
 * Also doubles as the shape of the **merged** view returned by consumers
 * (e.g. `getMetadataFromBook`): once values from each source are
 * collapsed by priority, the result is source-agnostic and any field can
 * be present, including filename-directive-only fields like
 * `googleVolumeId` that no concrete variant owns.
 */
export type BookMetadataFields = {
  title?: string | number
  authors?: string[]
  description?: string
  formatType?: ("book" | "comics" | "manga" | "audio")[]
  rating?: number
  coverLink?: string
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
}

type BookMetadataField = keyof BookMetadataFields

type BookMetadataVariant<
  TType extends string,
  TKeys extends BookMetadataField,
> = { type: TType } & Pick<BookMetadataFields, TKeys> & {
    [K in Exclude<BookMetadataField, TKeys>]?: never
  }

/**
 * Metadata extracted by querying the Google Books API. Cannot advertise
 * provider-specific identifiers (`isbn`, `googleVolumeId`), local-archive
 * fields (`contentType`, `size`), or `rights`.
 */
export type GoogleBookApiMetadata = BookMetadataVariant<
  "googleBookApi",
  | "title"
  | "authors"
  | "description"
  | "formatType"
  | "rating"
  | "coverLink"
  | "pageCount"
  | "date"
  | "publisher"
  | "languages"
  | "subjects"
>

/**
 * Metadata extracted from the file's contents (EPUB OPF or RAR/ZIP scan).
 * No descriptions, ratings, format types, or remote identifiers — those
 * are not embedded in the file itself.
 */
export type FileMetadata = BookMetadataVariant<
  "file",
  | "title"
  | "authors"
  | "publisher"
  | "rights"
  | "languages"
  | "date"
  | "subjects"
  | "coverLink"
  | "pageCount"
  | "contentType"
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
  "title" | "contentType" | "size"
>

/**
 * Metadata supplied directly by the end user. Currently only ISBN is
 * exposed for editing; expand the variant as new fields become editable.
 */
export type UserMetadata = BookMetadataVariant<"user", "isbn">

export type BookMetadata =
  | GoogleBookApiMetadata
  | FileMetadata
  | LinkMetadata
  | UserMetadata

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
export const REORDERABLE_BOOK_METADATA_SOURCES = [
  "file",
  "googleBookApi",
] as const

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
 * Every metadata source whose entries can appear on a book document —
 * also the union of values surfaced in the user-facing priority pane.
 */
export type BookMetadataSource = BookMetadata["type"]

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
    (middle ?? []).filter(isReorderableBookMetadataSource),
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
 * Runtime mirror of each variant's writable field set, used by UIs that
 * render per-source field lists. Pinned to the type with `satisfies` so
 * the two cannot drift.
 */
export const BOOK_METADATA_FIELDS_BY_SOURCE = {
  googleBookApi: [
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
    "publisher",
    "rights",
    "languages",
    "date",
    "subjects",
    "coverLink",
    "pageCount",
    "contentType",
  ],
  link: ["title", "contentType", "size"],
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
   * file: metadata scrapped from the file itself.
   * user: metadata from user. highest priority
   *
   * priority order:
   * [user, file, ..., link]
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
