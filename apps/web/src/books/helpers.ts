import { ReadingStateState, sortByTitleComparator } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { Logger } from "../debug/logger.shared"
import { useMemo } from "react"
import type { PromiseReturnType } from "../types"
import { type BookQueryResult, useBooks } from "./states"
import { useNetworkState } from "react-use"
import { usePluginRemoveBook } from "../plugins/usePluginRemoveBook"
import { getMetadataFromBook } from "./metadata"
import { useRefreshBookMetadata } from "./useRefreshBookMetadata"
import { useLock } from "../common/BlockingBackdrop"
import {
  CancelError,
  isPluginError,
  OfflineError,
} from "../errors/errors.shared"
import { useMutation } from "@tanstack/react-query"

export const useRemoveBook = () => {
  const { mutateAsync: removeDownload } = useRemoveDownloadFile()
  const { db } = useDatabase()
  const removeBookFromDataSource = usePluginRemoveBook()
  const network = useNetworkState()
  const [lock] = useLock()

  return useMutation({
    mutationFn: async ({
      id,
      deleteFromDataSource,
    }: {
      id: string
      deleteFromDataSource?: boolean
    }) => {
      if (deleteFromDataSource) {
        if (!network.online) {
          throw new OfflineError()
        }

        try {
          await removeBookFromDataSource(id)
        } catch (e) {
          if (isPluginError(e) && e.code === "cancelled") {
            throw new CancelError()
          }

          throw e
        }
      }

      const unlock = lock()

      await Promise.all([
        removeDownload({ bookId: id }),
        db?.book.findOne({ selector: { _id: id } }).remove(),
      ])

      unlock()
    },
  })
}

export const useRemoveTagFromBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } }),
  })
}

export const useAddTagToBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $push: { tags: tagId } }),
  })
}

export const useAddCollectionToBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      collectionId,
    }: {
      _id: string
      collectionId: string
    }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $push: { collections: collectionId } }),
  })
}

export const useRemoveCollectionFromBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      collectionId,
    }: {
      _id: string
      collectionId: string
    }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { collections: [collectionId] } }),
  })
}

export const useAddBook = () => {
  const { db: database } = useDatabase()
  const refreshMetadata = useRefreshBookMetadata()

  type Return = {
    book: PromiseReturnType<NonNullable<typeof database>["book"]["post"]>
    link: PromiseReturnType<NonNullable<typeof database>["link"]["safeInsert"]>
  }

  const addBook = async ({
    book,
    link,
  }: {
    book?: Partial<Parameters<NonNullable<typeof database>["book"]["post"]>[0]>
    link: Parameters<NonNullable<typeof database>["link"]["safeInsert"]>[0]
  }): Promise<Return | undefined> => {
    try {
      if (database) {
        const linkAdded = await database.link.safeInsert(link)

        const { tags, ...rest } = book || {}
        const newBook = await database.book.post({
          lastMetadataUpdatedAt: null,
          lastMetadataUpdateError: null,
          metadataUpdateStatus: null,
          readingStateCurrentBookmarkLocation: null,
          readingStateCurrentBookmarkProgressUpdatedAt: null,
          readingStateCurrentBookmarkProgressPercent: 0,
          readingStateCurrentState: ReadingStateState.NotStarted,
          createdAt: Date.now(),
          tags: tags || [],
          links: [linkAdded.primary],
          collections: [],
          modifiedAt: null,
          isAttachedToDataSource: false,
          ...rest,
        })

        refreshMetadata(newBook._id)

        return { book: newBook, link: linkAdded }
      }
    } catch (e) {
      Logger.error(e)
    }
  }

  return [addBook] as [typeof addBook]
}

export const useBookIdsSortedBy = (
  ids: string[],
  sorting: "date" | "activity" | "alpha" | undefined,
) => {
  const { data: books } = useBooks()

  return useMemo(() => {
    const filteredBooks = ids
      .map((id) => books?.find((book) => book._id === id))
      .filter((maybeBook) => !!maybeBook) as BookQueryResult[]

    return sortBooksBy(filteredBooks, sorting).map(({ _id }) => _id)
  }, [books, ids, sorting])
}

export const useBooksSortedBy = (
  books: BookQueryResult[] | undefined,
  sorting: "date" | "activity" | "alpha" | undefined,
) => {
  return useMemo(() => sortBooksBy(books ?? [], sorting), [books, sorting])
}

const sortBooksBy = (
  books: BookQueryResult[],
  sorting: "date" | "activity" | "alpha" | undefined,
) => {
  switch (sorting) {
    case "date": {
      // descend
      return [...books].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    }
    case "activity": {
      return [...books].sort((a, b) => {
        if (!a.readingStateCurrentBookmarkProgressUpdatedAt) return 1
        if (!b.readingStateCurrentBookmarkProgressUpdatedAt) return -1

        return (
          new Date(b.readingStateCurrentBookmarkProgressUpdatedAt).getTime() -
          new Date(a.readingStateCurrentBookmarkProgressUpdatedAt).getTime()
        )
      })
    }
    case "alpha": {
      return books.sort((a, b) =>
        sortByTitleComparator(
          getMetadataFromBook(a).title?.toString() ?? "",
          getMetadataFromBook(b).title?.toString() ?? "",
        ),
      )
    }
    default:
      return books
  }
}
