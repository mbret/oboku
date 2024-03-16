import {
  BookDocType,
  ReadingStateState,
  sortByTitleComparator
} from "@oboku/shared"
import { Database, useDatabase } from "../rxdb"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { Report } from "../debug/report.shared"
import { useCallback, useMemo } from "react"
import { PromiseReturnType } from "../types"
import { BookQueryResult, useBooksDic } from "./states"
import { AtomicUpdateFunction } from "rxdb"
import { useNetworkState } from "react-use"
import { from } from "rxjs"
import { useRemoveBookFromDataSource } from "../plugins/useRemoveBookFromDataSource"
import { useMutation } from "reactjrx"
import { isPluginError } from "../plugins/plugin-front"
import { getMetadataFromBook } from "./getMetadataFromBook"
import { useRefreshBookMetadata } from "./useRefreshBookMetadata"
import { CancelError, OfflineError } from "../common/errors/errors"

export const useRemoveBook = () => {
  const removeDownload = useRemoveDownloadFile()
  const { db } = useDatabase()
  const removeBookFromDataSource = useRemoveBookFromDataSource()
  const network = useNetworkState()

  return useMutation({
    mutationFn: async ({
      id,
      deleteFromDataSource
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

      await Promise.all([
        removeDownload(id),
        db?.book.findOne({ selector: { _id: id } }).remove()
      ])
    }
  })
}

export const useRemoveTagFromBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } })
  })
}

export const useAddTagToBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id, tagId }: { _id: string; tagId: string }) =>
      db?.book.findOne({ selector: { _id } }).update({ $push: { tags: tagId } })
  })
}

export const useAtomicUpdateBook = () => {
  const { db: database } = useDatabase()

  const updater = useCallback(
    async (id: string, mutationFunction: AtomicUpdateFunction<BookDocType>) => {
      const book = await database?.book
        .findOne({ selector: { _id: id } })
        .exec()

      return await book?.incrementalModify(mutationFunction)
    },
    [database]
  )

  return [updater] as [typeof updater]
}

export const useAddCollectionToBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      collectionId
    }: {
      _id: string
      collectionId: string
    }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $push: { collections: collectionId } })
  })
}

export const useRemoveCollectionFromBook = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      collectionId
    }: {
      _id: string
      collectionId: string
    }) =>
      db?.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { collections: [collectionId] } })
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
    link
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
          ...rest
        })
        refreshMetadata(newBook._id)

        return { book: newBook, link: linkAdded }
      }
    } catch (e) {
      Report.error(e)
    }
  }

  return [addBook] as [typeof addBook]
}

export const useBookIdsSortedBy = (
  ids: string[],
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  const { data: normalizedBooks = {} } = useBooksDic()

  return useMemo(() => {
    const books = ids
      .map((id) => normalizedBooks[id])
      .filter((maybeBook) => !!maybeBook) as BookQueryResult[]

    return sortBooksBy(books, sorting).map(({ _id }) => _id)
  }, [normalizedBooks, ids, sorting])
}

export const useBooksSortedBy = (
  books: BookQueryResult[] | undefined,
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  return useMemo(() => sortBooksBy(books ?? [], sorting), [books, sorting])
}

const sortBooksBy = (
  books: BookQueryResult[],
  sorting: "date" | "activity" | "alpha" | undefined
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
          getMetadataFromBook(a).title || "",
          getMetadataFromBook(b).title || ""
        )
      )
    }
    default:
      return books
  }
}

export const getBookById = ({
  database,
  id
}: {
  database: Database
  id: string
}) =>
  from(
    database.collections.book
      .findOne({
        selector: {
          _id: id
        }
      })
      .exec()
  )
