import { useAxiosClient } from "../axiosClient"
import { BookDocType, DataSourceType, ReadingStateState } from '@oboku/shared'
import { useRxMutation } from "../rxdb/hooks"
import { useDatabase } from "../rxdb"
import { useRemoveDownloadFile } from "../download/useRemoveDownloadFile"
import { Report } from "../report"
import { useCallback, useMemo } from "react"
import { useGetDataSourceCredentials } from "../dataSources/helpers"
import { useDownloadBook } from "../download/useDownloadBook"
import { PromiseReturnType } from "../types"
import { useRecoilValue } from "recoil"
import { normalizedBooksState, Book } from "./states"
import * as R from 'ramda';
import { sortByTitleComparator } from '@oboku/shared/dist/sorts'
import { AtomicUpdateFunction } from "rxdb"
import { useLock } from "../common/BlockingBackdrop"
import { useNetworkState } from "react-use"
import { useDialog } from "../dialog"
import { useSync } from "../rxdb/useSync"

export const useRemoveBook = () => {
  const removeDownload = useRemoveDownloadFile()
  const [removeBook] = useRxMutation((db, { id }: { id: string }) => db.book.findOne({ selector: { _id: id } }).remove())

  return async ({ id }: { id: string }) => {
    await Promise.all([
      removeDownload(id),
      removeBook({ id })
    ])
  }
}

export const useRemoveTagToBook = () => {
  const [removeTag] = useRxMutation(
    (db, { _id, tagId }: { _id: string, tagId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { tags: [tagId] } })
  )

  return (variables: { bookId: string, tagId: string }) => {
    removeTag({ _id: variables.bookId, tagId: variables.tagId })
  }
}

export const useAddTagToBook = () =>
  useRxMutation(
    (db, { _id, tagId }: { _id: string, tagId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $push: { tags: tagId } })
  )

export const useAtomicUpdateBook = () => {
  const database = useDatabase()

  const updater = useCallback(async (id: string, mutationFunction: AtomicUpdateFunction<BookDocType>) => {
    const book = await database?.book.findOne({ selector: { _id: id } }).exec()
    return await book?.atomicUpdate(mutationFunction)
  }, [database])

  return [updater]
}

export const useRefreshBookMetadata = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateBook] = useAtomicUpdateBook()
  const getDataSourceCredentials = useGetDataSourceCredentials()
  const dialog = useDialog()
  const network = useNetworkState()
  const sync = useSync()
  
  return async (bookId: string) => {
    if (!network.online) {
      return dialog({ preset: 'OFFLINE' })
    }
    const book = await database?.book.findOne({ selector: { _id: bookId } }).exec()
    const firstLink = await database?.link.findOne({ selector: { _id: book?.links[0] } }).exec()

    if (!firstLink || firstLink?.type === DataSourceType.FILE) return

    const credentials = await getDataSourceCredentials(firstLink.type)

    if ('isError' in credentials && credentials.reason === 'cancelled') return
    if ('isError' in credentials) throw credentials.error || new Error('')

    await updateBook(bookId, old => ({ ...old, metadataUpdateStatus: 'fetching' }))

    try {
      await sync(['link', 'book'])
      await client.refreshMetadata(bookId, credentials.data)
    } catch (e) {
      await updateBook(bookId, old => ({ ...old, metadataUpdateStatus: null, lastMetadataUpdateError: 'unknown' }))
      Report.error(e)
    }
  }
}

export const useAddCollectionToBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string, collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $push: { collections: collectionId } })
  )

export const useRemoveCollectionFromBook = () =>
  useRxMutation(
    (db, { _id, collectionId }: { _id: string, collectionId: string }) =>
      db.book
        .findOne({ selector: { _id } })
        .update({ $pullAll: { collections: [collectionId] } })
  )

export const useAddBook = () => {
  const database = useDatabase()
  const refreshMetadata = useRefreshBookMetadata()

  type Return = { book: PromiseReturnType<NonNullable<typeof database>['book']['post']>, link: PromiseReturnType<NonNullable<typeof database>['link']['post']> }

  const addBook = async ({
    book,
    link
  }: {
    book?: Partial<Parameters<NonNullable<typeof database>['book']['post']>[0]>
    link: Parameters<NonNullable<typeof database>['link']['post']>[0]
  }): Promise<Return | undefined> => {
    try {
      if (database) {
        const linkAdded = await database.link.post(link)
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
          tags: [],
          links: [linkAdded.primary],
          date: null,
          publisher: null,
          rights: null,
          subject: null,
          creator: null,
          collections: [],
          modifiedAt: null,
          ...book,
        })
        refreshMetadata(newBook._id)

        return { book: newBook, link: linkAdded }
      }
    } catch (e) {
      Report.error(e)
    }
  }

  return [addBook]
}

export const useAddBookFromFile = () => {
  const [addBook] = useAddBook()
  const downloadFile = useDownloadBook()

  return useCallback(async (file: File) => {
    const { book } = await addBook({
      link: {
        book: null,
        data: null,
        resourceId: 'file',
        type: DataSourceType.FILE,
        createdAt: new Date().toISOString(),
        modifiedAt: null
      },
      book: {
        title: file.name,
        lastMetadataUpdatedAt: Date.now(),
      }
    }) || {}
    if (book) {
      await downloadFile(book._id, file)
    }
  }, [addBook, downloadFile])
}

export const useBookIdsSortedBy = (ids: string[], sorting: 'date' | 'activity' | 'alpha' | undefined) => {
  const normalizedBooks = useRecoilValue(normalizedBooksState)

  return useMemo(() => {
    const books = ids.map(id => normalizedBooks[id]) as Book[]

    return sortBooksBy(books, sorting).map(({ _id }) => _id)
  }, [normalizedBooks, ids, sorting])
}

export const useBooksSortedBy = (books: Book[], sorting: 'date' | 'activity' | 'alpha' | undefined) => {
  return useMemo(() => sortBooksBy(books, sorting), [books, sorting])
}

const sortBooksBy = (books: Book[], sorting: 'date' | 'activity' | 'alpha' | undefined) => {
  switch (sorting) {
    case 'date': {
      return R.sort(R.descend(R.prop('createdAt')), books)
    }
    case 'activity': {
      return R.sort((a, b) => {
        if (!a.readingStateCurrentBookmarkProgressUpdatedAt) return 1
        if (!b.readingStateCurrentBookmarkProgressUpdatedAt) return -1
        return (new Date(b.readingStateCurrentBookmarkProgressUpdatedAt).getTime()) - (new Date(a.readingStateCurrentBookmarkProgressUpdatedAt).getTime())
      }, books)
    }
    case 'alpha': {
      return books.sort((a, b) => sortByTitleComparator(a.title || '', b.title || ''))
    }
    default: return books
  }
}