import type { BookMetadata, ReorderableBookMetadataSource } from "../metadata"
import type { CouchDBMeta } from "./couchdb"
import type { RxDbMeta } from "./rxdb"

export const getBookCoverKey = (userNameHex: string, bookId: string) =>
  `cover-${userNameHex}-${bookId}`

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
    readingStateCurrentBookmarkLocation: string | null
    /**
     * @important
     * This is independent from readingStateCurrentState. A book can be
     * finished but not have a progress of 100% because the user want back
     * for example. Same as readingStateCurrentBookmarkLocation. They both represent
     * the last user position.
     */
    readingStateCurrentBookmarkProgressPercent: number
    readingStateCurrentBookmarkProgressUpdatedAt: string | null
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
  }
