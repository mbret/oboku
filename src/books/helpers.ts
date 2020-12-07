import { BookDocType, DownloadState, LinkType, ReadingStateState, useDatabase } from "../rxdb/databases"
import { useRxMutation } from "../rxdb/hooks"

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
  const db = useDatabase()

  const cb = async ({ linkUrl }: { linkUrl: string }) => {
    try {
      if (db) {
        const linkAdded = await db.link.post({
          type: LinkType.Uri,
          resourceId: linkUrl,
          data: null,
          books: [],
        })
        await db.book.post({
          lastMetadataUpdatedAt: null,
          title: null,
          readingStateCurrentBookmarkLocation: null,
          readingStateCurrentBookmarkProgressUpdatedAt: null,
          readingStateCurrentBookmarkProgressPercent: 0,
          readingStateCurrentState: ReadingStateState.NotStarted,
          createdAt: 1604302214598,
          downloadState: DownloadState.None,
          downloadProgress: 0,
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
      }
    } catch (e) {
      console.error(e)
    }
  }

  return [cb]
}