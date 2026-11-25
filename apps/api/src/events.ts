import { SourceType, SourceApiCredentials } from "@oboku/shared"

export enum Events {
  BOOKS_METADATA_REFRESH = "books.metadata.refresh",
  COLLECTION_METADATA_REFRESH = "collection.metadata.refresh",
}

export class BooksMetadataRefreshEvent {
  constructor(
    public data: {
      bookId: string
      providerCredentials: SourceApiCredentials<SourceType>
      email: string
    },
  ) {}
}

export class CollectionMetadataRefreshEvent {
  constructor(
    public data: {
      collectionId: string
      providerCredentials: SourceApiCredentials<SourceType>
      soft: boolean
      email: string
    },
  ) {}
}
