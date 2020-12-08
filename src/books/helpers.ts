import { useAxiosClient } from "../axiosClient"
import { BookDocType, LinkType, ReadingStateState } from 'oboku-shared'
import { useRxMutation } from "../rxdb/hooks"
import { useDatabase } from "../rxdb"
import { API_SYNC_URL } from "../constants"
import { first } from 'rxjs/operators'
import PouchDB from 'pouchdb'

export const useRemoveBook = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.book.findOne({ selector: { _id: id } }).remove())

export const useRemoveTagToBook = () => {
  const [removeTag] = useRxMutation<{ bookId: string, tagId: string }>(
    (db, { variables: { bookId, tagId } }) =>
      db.book
        .findOne({ selector: { _id: bookId } })
        .update({ $pullAll: { tags: [tagId] } })
  )

  return (variables: { bookId: string, tagId: string }) => {
    removeTag(variables)
  }
}

export const useAddTagToBook = () =>
  useRxMutation<{ bookId: string, tagId: string }>(
    (db, { variables: { bookId, tagId } }) =>
      db.book
        .findOne({ selector: { _id: bookId } })
        .update({ $push: { tags: tagId } })
  )

export const useUpdateBook = () =>
  useRxMutation<Partial<BookDocType> & Required<Pick<BookDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.book.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )

export const useRefreshBookMetadata = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateBook] = useUpdateBook()

  return async (bookId: string) => {
    console.log(bookId)
    await updateBook({ _id: bookId, lastMetadataUpdatedAt: null })

    database?.sync({
      collectionNames: ['link', 'book'],
      syncOptions: () => ({
        remote: new PouchDB(API_SYNC_URL, {
          fetch: (url, opts) => {
            (opts?.headers as unknown as Map<string, string>).set('Authorization', client.getAuthorizationHeader())
            return PouchDB.fetch(url, opts)
          }
        }),
        direction: {
          push: true,
        },
        options: {
          retry: false,
          live: false,
          timeout: 5000,
        }
      })
    })
      .complete$
      .pipe(first())
      .subscribe(completed => {
        completed && client.refreshMetadata(bookId).catch(console.error)
      })
  }
}

export const useAddCollectionToBook = () =>
  useRxMutation<{ bookId: string, collectionId: string }>(
    (db, { variables: { bookId, collectionId } }) =>
      db.book
        .findOne({ selector: { _id: bookId } })
        .update({ $push: { collections: collectionId } })
  )

export const useRemoveCollectionFromBook = () =>
  useRxMutation<{ bookId: string, collectionId: string }>(
    (db, { variables: { bookId, collectionId } }) =>
      db.book
        .findOne({ selector: { _id: bookId } })
        .update({ $pullAll: { collections: [collectionId] } })
  )

export const useAddBook = () => {
  const database = useDatabase()
  const refreshMetadata = useRefreshBookMetadata()

  const cb = async ({ linkUrl }: { linkUrl: string }) => {
    try {
      if (database) {
        const linkAdded = await database.link.post({
          type: LinkType.Uri,
          resourceId: linkUrl,
          data: null,
        })
        const book = await database.book.post({
          lastMetadataUpdatedAt: null,
          title: null,
          readingStateCurrentBookmarkLocation: null,
          readingStateCurrentBookmarkProgressUpdatedAt: null,
          readingStateCurrentBookmarkProgressPercent: 0,
          readingStateCurrentState: ReadingStateState.NotStarted,
          createdAt: 1604302214598,
          lang: null,
          tags: [],
          links: [linkAdded.primary],
          date: Date.now(),
          publisher: null,
          rights: null,
          subject: null,
          creator: null,
          collections: [],
        })
        refreshMetadata(book._id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return [cb]
}