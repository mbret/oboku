import {
  type BookDocType,
  type LinkDocTypeForProvider,
  ReadingStateState,
} from "@oboku/shared"

export const book: BookDocType = {
  _id: "book-1",
  _rev: "1-book",
  collections: [],
  createdAt: 1,
  isAttachedToDataSource: true,
  lastMetadataUpdateError: null,
  lastMetadataUpdatedAt: null,
  links: ["link-1"],
  metadataUpdateStatus: null,
  modifiedAt: null,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateUpdatedAt: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  tags: [],
}

export const link: LinkDocTypeForProvider<"URI"> = {
  _id: "link-1",
  _rev: "1-link",
  book: book._id,
  createdAt: "2026-08-01T00:00:00.000Z",
  data: { url: "https://example.com/book.epub" },
  modifiedAt: null,
  rx_model: "link",
  rxdbMeta: { lwt: 1 },
  type: "URI",
}
