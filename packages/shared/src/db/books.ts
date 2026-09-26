import type { BookMetadata, ReorderableBookMetadataSource } from "../metadata"
import type { CouchDBMeta } from "./couchdb"
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
     * Where the reader last was, as a cfi to reopen the book at. `null` when
     * there is no such place: a book never opened, or marked finished or
     * unread by hand, which reopens at its start.
     */
    readingStateCurrentBookmarkLocation: string | null
    /**
     * How far into the book readingStateCurrentBookmarkLocation is, from 0 to
     * 1, and `0` when it is `null`. They both represent the last user position.
     *
     * @important
     * This is independent from readingStateCurrentState. A book can be
     * finished but not have a progress of 100%: the position is where the
     * reader's page starts, short of 1 on the last page, and the user can go
     * back. Anything showing progress reads a finished book as fully read
     * from its state.
     */
    readingStateCurrentBookmarkProgressPercent: number
    /**
     * @deprecated Superseded by readingStateUpdatedAt, and no longer written.
     * It is still the only date on a book whose reading state last changed
     * before readingStateUpdatedAt existed, or on an older version of the app.
     */
    readingStateCurrentBookmarkProgressUpdatedAt?: string | null
    /**
     * When the reading state last changed, by reading or by hand: the
     * position, its progress or readingStateCurrentState. Books are ordered by
     * it for recent activity, together with the deprecated
     * readingStateCurrentBookmarkProgressUpdatedAt. `null` or missing when it
     * has not changed since the book was added, or last changed before this
     * field existed.
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
     * `["file", "googleBookApi"]` is used.
     */
    metadataSourcePriority?: ReorderableBookMetadataSource[]
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

const isDateSet = (date: string | null | undefined): date is string => !!date

/**
 * When a book's reading state last changed, in milliseconds, or `undefined`
 * when it never did: the later of `readingStateUpdatedAt` and the deprecated
 * date it superseded, which older versions of the app still write. Nothing
 * backfilled `readingStateUpdatedAt`, so a book unchanged since it existed
 * only has the deprecated date.
 *
 * TODO(ask the maintainer, added 2026-09): this fallback and the deprecated
 * `readingStateCurrentBookmarkProgressUpdatedAt` are meant to be removed once
 * older versions of the app are gone. After a few months, raise it with the
 * maintainer rather than removing it: dropping it either needs a CouchDB
 * backfill first (the API's `MigrationService`, see AGENTS.md), or sends the
 * books still holding only the deprecated date to the bottom of recent
 * activity.
 */
export const getReadingStateUpdatedTime = ({
  readingStateUpdatedAt,
  readingStateCurrentBookmarkProgressUpdatedAt,
}: Pick<
  BookDocType,
  "readingStateUpdatedAt" | "readingStateCurrentBookmarkProgressUpdatedAt"
>) => {
  const times = [
    readingStateUpdatedAt,
    readingStateCurrentBookmarkProgressUpdatedAt,
  ]
    .filter(isDateSet)
    .map((date) => new Date(date).getTime())

  return times.length > 0 ? Math.max(...times) : undefined
}
