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
import { useLock } from "../common/BlockingBackdrop"
import { useNetworkState } from "react-use"
import { useDialogManager } from "../dialog"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { catchError, EMPTY, from, map, switchMap } from "rxjs"
import { useRemoveBookFromDataSource } from "../plugins/useRemoveBookFromDataSource"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useMutation } from "reactjrx"
import { isPluginError } from "../plugins/plugin-front"
import { httpClient } from "../http/httpClient"
import { getMetadataFromBook } from "./getMetadataFromBook"

export const useRemoveBook = () => {
  const removeDownload = useRemoveDownloadFile()
  const { db } = useDatabase()
  const dialog = useDialogManager()
  const [lock] = useLock()
  const removeBookFromDataSource = useRemoveBookFromDataSource()
  const network = useNetworkState()

  return useCallback(
    async ({
      id,
      deleteFromDataSource
    }: {
      id: string
      deleteFromDataSource?: boolean
    }) => {
      let unlock = () => {}

      try {
        if (deleteFromDataSource) {
          if (!network.online) {
            return dialog({ preset: "OFFLINE" })
          }

          try {
            await removeBookFromDataSource(id)
          } catch (e) {
            if (isPluginError(e) && e.code === "cancelled") {
              return
            }

            Report.error(e)

            return dialog({ preset: "UNKNOWN_ERROR" })
          } finally {
            unlock()
          }
        }

        await Promise.all([
          removeDownload(id),
          db?.book.findOne({ selector: { _id: id } }).remove()
        ])
      } catch (e) {
        Report.error(e)
      }
    },
    [removeDownload, removeBookFromDataSource, network, dialog, db]
  )
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

export const useRefreshBookMetadata = () => {
  const { db: database } = useDatabase()
  const [updateBook] = useAtomicUpdateBook()
  const dialog = useDialogManager()
  const network = useNetworkState()
  const { mutateAsync: sync } = useSyncReplicate()
  const refreshPluginMetadata = usePluginRefreshMetadata()

  return async (bookId: string) => {
    try {
      if (!network.online) {
        return dialog({ preset: "OFFLINE" })
      }

      const book = await database?.book
        .findOne({ selector: { _id: bookId } })
        .exec()

      const firstLink = await database?.link
        .findOne({ selector: { _id: book?.links[0] } })
        .exec()

      if (!firstLink) {
        Report.warn(`Trying to refresh metadata of file item ${bookId}`)

        return
      }

      const { data: pluginMetadata } = await refreshPluginMetadata(firstLink)

      if (!database) return

      from(
        updateBook(bookId, (old) => ({
          ...old,
          metadataUpdateStatus: "fetching"
        }))
      )
        .pipe(
          switchMap(() => from(sync([database.link, database.book]))),
          switchMap(() =>
            from(httpClient.refreshMetadata(bookId, pluginMetadata))
          ),
          catchError((e) =>
            from(
              updateBook(bookId, (old) => ({
                ...old,
                metadataUpdateStatus: null,
                lastMetadataUpdateError: "unknown"
              }))
            ).pipe(
              map((_) => {
                throw e
              })
            )
          ),
          catchError((e) => {
            Report.error(e)

            return EMPTY
          })
        )
        .subscribe()
    } catch (e) {
      if (isPluginError(e) && e.code === "cancelled") return

      Report.error(e)
    }
  }
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
  books: BookQueryResult[],
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  return useMemo(() => sortBooksBy(books, sorting), [books, sorting])
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
