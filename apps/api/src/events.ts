export enum Events {
  BOOKS_METADATA_REFRESH = "books.metadata.refresh",
  COLLECTION_METADATA_REFRESH = "collection.metadata.refresh",
}

export class BooksMetadataRefreshEvent {
  constructor(
    public data: {
      bookId: string
      data?: Record<string, unknown>
      email: string
    },
  ) {}
}

export class CollectionMetadataRefreshEvent {
  constructor(
    public data: {
      collectionId: string
      data?: Record<string, unknown>
      soft: boolean
      email: string
    },
  ) {}
}
