export enum Events {
  BOOKS_METADATA_REFRESH = "books.metadata.refresh",
}

export class BooksMetadataRefreshEvent {
  constructor(
    public data: {
      bookId: string
      obokuCredentials: Record<string, string>
      authorization: string
    },
  ) {}
}
