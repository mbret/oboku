import type {
  BookMetadata,
  LEGACY_CATALOG_SOURCE_NAME,
  ReorderableBookMetadataSource,
} from "../metadata"
import type { CouchDBMeta } from "./couchdb"
import type { DeprecatedBookDocType, InsertAbleBookDocType } from "./docTypes"
import type { RxDbMeta } from "./rxdb"

export enum ReadingStateState {
  Finished = "FINISHED",
  NotStarted = "NOT_STARTED",
  Reading = "READING",
}

export type BookDocType = CouchDBMeta &
  RxDbMeta & {
    createdAt: number
    lastMetadataUpdatedAt: number | null
    metadataUpdateStatus: null | "fetching"
    lastMetadataUpdateError: null | string
    /**
     * Where the reader last was, as a cfi to reopen the book at. Only a place
     * the reader has found is saved: a book closed before the reader finds
     * where a navigation leads keeps the place it had. `null` when there is
     * no such place: a book never opened, or marked finished or unread by
     * hand, which reopens at its start.
     */
    readingStateCurrentBookmarkLocation: string | null
    /**
     * When readingStateCurrentBookmarkLocation last moved to another place,
     * or the book was marked finished or unread by hand. Unlike
     * readingStateUpdatedAt, opening the book at its bookmark leaves it, as
     * does a progress recomputed for the same place: it tells how recent the
     * position is. A book without a bookmark opens at its start without
     * moving it. `null` on a book never read. Missing on a book last read
     * before it existed.
     */
    readingStateCurrentBookmarkLocationUpdatedAt?: string | null
    /**
     * How far into the book readingStateCurrentBookmarkLocation is, from 0 to
     * 1, and `0` when it is `null`. They both represent the last user position:
     * this is the place to reopen at for a reader that does not understand
     * cfis. For showing progress, use readingStateReachedProgressPercent.
     *
     * @important
     * This is independent from readingStateCurrentState. A book can be
     * finished but not have a progress of 100%: the position is where the
     * reader's page starts, short of 1 on the last page, and the user can go
     * back.
     */
    readingStateCurrentBookmarkProgressPercent: number
    /**
     * readingStateCurrentBookmarkLocation in KOReader's form: the `progress` a
     * KOReader sync server keeps for a book, an xpointer for a reflowable book
     * and a page number for one with pages. Whatever writes the bookmark
     * writes this too, `null` when the bookmark has none: no bookmark, or a
     * place prose's KOReader enhancer cannot express. Missing on a book last
     * read before it existed. An older version of the app only writes the
     * bookmark, so a book it updates keeps a stale value until a newer
     * version writes it again.
     */
    readingStateCurrentBookmarkKoreaderProgress?: string | null
    /**
     * The `document` a KOReader sync server files
     * readingStateCurrentBookmarkKoreaderProgress under: the digest of the
     * file the bookmark was saved in, as KOReader computes it by default
     * ("Binary" document matching). Written with it, from the same file, so a
     * changed file takes its own document with the next position saved.
     * `null` when there is no bookmark. Missing on a book last read before
     * it existed.
     */
    readingStateCurrentBookmarkKoreaderDocument?: string | null
    /**
     * How far into the book what the reader last saw reaches, from 0 to 1:
     * the pages on screen count as read, so page 9 of 10 is 0.9 and the last
     * page 1, as the reader itself shows it. Until that estimate settles for
     * the reader's latest navigation, it is the bookmark's progress. The
     * progress to show; it can be ahead of the bookmark. Missing on a book
     * last read before it existed: read it through
     * {@link getReadingStateReachedProgress}.
     */
    readingStateReachedProgressPercent?: number
    /**
     * When the book was last opened, read or marked by hand: opening it in
     * the reader, or a change of the position, its progress, or
     * readingStateCurrentState. Books are ordered by it for recent activity,
     * together with the date it superseded (see
     * {@link getReadingStateUpdatedTime}). For how recent the position is,
     * read readingStateCurrentBookmarkLocationUpdatedAt. `null` or missing
     * when none of this happened since the book was added, or last happened
     * before this field existed.
     */
    readingStateUpdatedAt?: string | null
    /**
     * @important
     * Name is a bit deceptive but a finished book CAN have a bookmark or a progress
     * that is not 1. In case the user decided to revisit the book. This property is
     * more of a flag than a state.
     */
    readingStateCurrentState: ReadingStateState
    tags: string[]
    links: string[]
    collections: string[]
    rx_model: "book"
    modifiedAt: string | null
    isAttachedToDataSource: boolean
    isNotInterested?: boolean
    metadata?: BookMetadata[]
    /**
     * Tri-state user override for external metadata fetching:
     * - `undefined` / `null`: follow protection (skip when protected, fetch otherwise)
     * - `true`: always fetch external metadata, even if protected
     * - `false`: never fetch external metadata
     *
     * Use {@link resolveMetadataFetchEnabled} to collapse this to a boolean.
     * Only gates calls to third-party providers; does not affect local extraction.
     */
    metadataFetchEnabled?: boolean | null
    /**
     * User override controlling whether the API may download the book's source
     * file during a metadata refresh in order to extract local information
     * (cover, embedded metadata, content type, ...).
     * - `undefined` / `null` / `true`: download allowed (default behaviour)
     * - `false`: never download the file when refreshing metadata
     *
     * Use {@link resolveMetadataFileDownloadEnabled} to collapse this to a
     * boolean. Does not affect user-initiated downloads (reading the book).
     */
    metadataFileDownloadEnabled?: boolean | null
    /**
     * User-defined priority for the swappable middle of the metadata-source
     * merge order. The full effective priority is:
     * `["user", ...metadataSourcePriority, "link"]` (highest → lowest).
     *
     * `user` is always highest and `link` always lowest, so only the
     * reorderable subset is persisted here. When omitted, the default order
     * `["file", "catalog"]` is used. Older versions of the app write the
     * catalog as {@link LEGACY_CATALOG_SOURCE_NAME}: read it through
     * {@link getOrderedBookMetadataSources}.
     */
    metadataSourcePriority?: (
      | ReorderableBookMetadataSource
      | typeof LEGACY_CATALOG_SOURCE_NAME
    )[]
    /**
     * Opaque key identifying the cover image currently stored in the
     * bucket for this book. Built via {@link buildBookBucketCoverKey} on
     * every successful upload (in `updateCover`) and used as the source
     * of truth when deciding whether the bucket image is already up to
     * date — independent from the live merge of `metadata` +
     * `metadataSourcePriority`, which can drift (priority changes,
     * metadata edits, out-of-band overwrites) and is therefore unreliable
     * as a "what's actually in the bucket" signal.
     *
     * `undefined` / `null` means we don't know what's in the bucket
     * (legacy books pre-dating this field, or never-uploaded covers); in
     * that case the skip-equality check fails and we re-upload once to
     * repopulate.
     */
    bucketCoverKey?: string | null
  }

/**
 * The bookmark of a book that has none, so it opens at its start. Whatever
 * clears a bookmark spreads it, so the bookmark's progress and KOReader form
 * go with it.
 */
export const emptyBookmark = {
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateCurrentBookmarkKoreaderProgress: null,
  readingStateCurrentBookmarkKoreaderDocument: null,
} satisfies Partial<BookDocType>

/**
 * A book nothing has happened to yet: no metadata fetched, never opened, in
 * no collection. The web app and the API create their books from it, with
 * what they know of each on top.
 */
export const createBookDefaults = (): Omit<
  InsertAbleBookDocType,
  "rx_model" | "rxdbMeta"
> => ({
  createdAt: Date.now(),
  modifiedAt: null,
  collections: [],
  links: [],
  tags: [],
  isAttachedToDataSource: false,
  lastMetadataUpdatedAt: null,
  lastMetadataUpdateError: null,
  metadataUpdateStatus: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  ...emptyBookmark,
  readingStateCurrentBookmarkLocationUpdatedAt: null,
  readingStateReachedProgressPercent: 0,
  readingStateUpdatedAt: null,
})

const isDateSet = (date: string | null | undefined): date is string => !!date

/**
 * When a book was last opened, read or marked by hand, in milliseconds, or
 * `undefined` when it never was: the later of `readingStateUpdatedAt` and
 * the deprecated date it superseded, which older versions of the app still
 * write. Nothing backfilled `readingStateUpdatedAt`, so a book unchanged
 * since it existed only has the deprecated date.
 *
 * TODO(ask the maintainer, added 2026-09): this fallback and the deprecated
 * `readingStateCurrentBookmarkProgressUpdatedAt` are meant to be removed once
 * older versions of the app are gone. After a few months, raise it with the
 * maintainer rather than removing it: dropping it either needs a CouchDB
 * backfill first (the API's `MigrationService`, see AGENTS.md), or sends the
 * books still holding only the deprecated date to the bottom of recent
 * activity. Its entry in the RxDB book schema goes only once no CouchDB
 * document holds the field: RxDB rejects undeclared properties.
 */
export const getReadingStateUpdatedTime = ({
  readingStateUpdatedAt,
  readingStateCurrentBookmarkProgressUpdatedAt,
}: Pick<BookDocType, "readingStateUpdatedAt"> &
  Pick<
    DeprecatedBookDocType,
    "readingStateCurrentBookmarkProgressUpdatedAt"
  >) => {
  const times = [
    readingStateUpdatedAt,
    readingStateCurrentBookmarkProgressUpdatedAt,
  ]
    .filter(isDateSet)
    .map((date) => new Date(date).getTime())

  return times.length > 0 ? Math.max(...times) : undefined
}

/**
 * The progress to show for a book, from 0 to 1. The state decides first: a
 * finished book is fully read and one not started is at 0, whatever progress
 * is stored. Otherwise it is the book's `readingStateReachedProgressPercent`,
 * or on a book last read before that existed, its bookmark progress, which
 * then held the same estimate. An older version of the app only writes the
 * bookmark progress, so a book it updates shows a stale value until a newer
 * version writes it again.
 *
 * TODO(ask the maintainer, added 2026-09): raise dropping this fallback
 * together with the one in getReadingStateUpdatedTime. Like it, it needs a
 * CouchDB backfill first, or books not read since would show 0.
 */
export const getReadingStateReachedProgress = ({
  readingStateCurrentState,
  readingStateReachedProgressPercent,
  readingStateCurrentBookmarkProgressPercent,
}: Pick<
  BookDocType,
  | "readingStateCurrentState"
  | "readingStateReachedProgressPercent"
  | "readingStateCurrentBookmarkProgressPercent"
>) => {
  if (readingStateCurrentState === ReadingStateState.Finished) return 1
  if (readingStateCurrentState === ReadingStateState.NotStarted) return 0

  return (
    readingStateReachedProgressPercent ??
    readingStateCurrentBookmarkProgressPercent
  )
}
