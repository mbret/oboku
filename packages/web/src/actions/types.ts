export type BookAction =
  | {
      type: `UPSERT_BOOK_LINK`
      data: {
        bookId: string
        linkResourceId: string
        linkType: string
      }
    }
  | {
      type: `UPSERT_BOOK_LINK_END`
      data: string
    }

export type Action = BookAction
