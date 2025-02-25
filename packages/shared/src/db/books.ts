import { BookMetadata } from "../metadata"
import { CouchDBMeta } from "./couchdb"
import { RxDbMeta } from "./rxdb"

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
    readingStateCurrentBookmarkProgressPercent: number
    readingStateCurrentBookmarkProgressUpdatedAt: string | null
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
