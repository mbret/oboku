export enum Events {
  BOOKS_METADATA_REFRESH = "books.metadata.refresh",
  COLLECTION_METADATA_REFRESH = "collection.metadata.refresh",
}

export class BooksMetadataRefreshEvent {
  constructor(
    public data: {
      bookId: string
      obokuCredentials: Record<string, string>
      authorization: string
      email: string
    },
  ) {}
}

export class CollectionMetadataRefreshEvent {
  constructor(
    public data: {
      collectionId: string
      obokuCredentials: Record<string, string>
      authorization: string
      soft: boolean
      email: string
    },
  ) {}
}
