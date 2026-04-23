import type { BookMetadata } from "../metadata"
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
  }
