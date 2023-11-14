import { useAxiosClient } from "../axiosClient"
import {
  BookDocType,
  ReadingStateState,
  sortByTitleComparator
} from "@oboku/shared"
import { useRxMutation } from "../rxdb/hooks"
import { useDatabase } from "../rxdb"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { Report } from "../debug/report.shared"
import { useCallback, useMemo } from "react"
import { useDownloadBook } from "../download/useDownloadBook"
import { PromiseReturnType } from "../types"
import { useRecoilValue } from "recoil"
import { normalizedBooksState, Book } from "./states"
import * as R from "ramda"
import { AtomicUpdateFunction } from "rxdb"
import { useLock } from "../common/BlockingBackdrop"
import { useNetworkState } from "react-use"
import { useDialogManager } from "../dialog"
import { useSync } from "../rxdb/useSync"
import { catchError, EMPTY, from, map, switchMap } from "rxjs"
import { useRemoveBookFromDataSource } from "../plugins/useRemoveBookFromDataSource"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { isPluginError } from "../plugins/plugin-front"

export const useRemoveBook = () => {
  const removeDownload = useRemoveDownloadFile()
  const [removeBook] = useRxMutation((db, { id }: { id: string }) =>
    db.book.findOne({ selector: { _id: id } }).remove()
  )
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
          unlock = lock()
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

        await Promise.all([removeDownload(id), removeBook({ id })])
      } catch (e) {
        Report.error(e)
      }
    },
    [
      lock,
      removeBook,
      removeDownload,
      removeBookFromDataSource,
      network,
      dialog
    ]
  )
}

export const useRemoveTagFromBook = () => {
  const [removeTag] = useRxMutation(
    (db, { _id, tagId }: { _id: string; tagId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } })
  )

  return useCallback(
    (variables: { bookId: string; tagId: string }) => {
      removeTag({ _id: variables.bookId, tagId: variables.tagId }).catch(
        Report.error
      )
    },
    [removeTag]
  )
}

export const useAddTagToBook = () => {
  const [addTag] = useRxMutation(
    (db, { _id, tagId }: { _id: string; tagId: string }) =>
      db.book.findOne({ selector: { _id } }).update({ $push: { tags: tagId } })
  )

  return useCallback(
    (variables: Parameters<typeof addTag>[0]) => {
      addTag(variables).catch(Report.error)
    },
    [addTag]
  )
}

export const useAtomicUpdateBook = () => {
  const { db: database } = useDatabase()

  const updater = useCallback(
    async (id: string, mutationFunction: AtomicUpdateFunction<BookDocType>) => {
      const book = await database?.book
        .findOne({ selector: { _id: id } })
        .exec()

      return await book?.atomicUpdate(mutationFunction)
    },
    [database]
  )

  return [updater] as [typeof updater]
}

export const useRefreshBookMetadata = () => {
  const client = useAxiosClient()
  const { db: database } = useDatabase()
  const [updateBook] = useAtomicUpdateBook()
  const dialog = useDialogManager()
  const network = useNetworkState()
  const sync = useSync()
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

      if (!firstLink || firstLink?.type === `FILE`) {
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
          switchMap(() => sync([database.link, database.book])),
          switchMap(() => from(client.refreshMetadata(bookId, pluginMetadata))),
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

export const useAddCollectionToBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string; collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $push: { collections: collectionId } })
  )

export const useRemoveCollectionFromBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string; collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { collections: [collectionId] } })
  )

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
          title: null,
          readingStateCurrentBookmarkLocation: null,
          readingStateCurrentBookmarkProgressUpdatedAt: null,
          readingStateCurrentBookmarkProgressPercent: 0,
          readingStateCurrentState: ReadingStateState.NotStarted,
          createdAt: Date.now(),
          lang: null,
          tags: tags || [],
          links: [linkAdded.primary],
          date: null,
          publisher: null,
          rights: null,
          subject: null,
          creator: null,
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

export const useAddBookFromFile = () => {
  const [addBook] = useAddBook()
  const downloadFile = useDownloadBook()

  return useCallback(
    async (file: File) => {
      const { book } =
        (await addBook({
          link: {
            book: null,
            data: null,
            resourceId: "file",
            type: `FILE`,
            createdAt: new Date().toISOString(),
            modifiedAt: null
          },
          book: {
            title: file.name,
            lastMetadataUpdatedAt: Date.now()
          }
        })) || {}
      if (book) {
        await downloadFile(book, file)
      }
    },
    [addBook, downloadFile]
  )
}

export const useBookIdsSortedBy = (
  ids: string[],
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  const normalizedBooks = useRecoilValue(normalizedBooksState)

  return useMemo(() => {
    const books = ids
      .map((id) => normalizedBooks[id])
      .filter((maybeBook) => !!maybeBook) as Book[]

    return sortBooksBy(books, sorting).map(({ _id }) => _id)
  }, [normalizedBooks, ids, sorting])
}

export const useBooksSortedBy = (
  books: Book[],
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  return useMemo(() => sortBooksBy(books, sorting), [books, sorting])
}

const sortBooksBy = (
  books: Book[],
  sorting: "date" | "activity" | "alpha" | undefined
) => {
  switch (sorting) {
    case "date": {
      return R.sort(R.descend(R.prop("createdAt")), books)
    }
    case "activity": {
      return R.sort((a, b) => {
        if (!a.readingStateCurrentBookmarkProgressUpdatedAt) return 1
        if (!b.readingStateCurrentBookmarkProgressUpdatedAt) return -1
        return (
          new Date(b.readingStateCurrentBookmarkProgressUpdatedAt).getTime() -
          new Date(a.readingStateCurrentBookmarkProgressUpdatedAt).getTime()
        )
      }, books)
    }
    case "alpha": {
      return books.sort((a, b) =>
        sortByTitleComparator(a.title || "", b.title || "")
      )
    }
    default:
      return books
  }
}
