import { useRxMutation } from "../rxdb/hooks";
import { LinkDocType, DataSourceType } from '@oboku/shared'
import { useRefreshBookMetadata } from "../books/helpers";
import { useDatabase } from "../rxdb";
import { useCallback } from "react";
import { Report } from "../debug/report";

type EditLinkPayload = Partial<LinkDocType> & Required<Pick<LinkDocType, '_id'>>

export const useEditLink = () => {
  const db = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()
  const [editLink] = useRxMutation(
    (db, { _id, ...rest }: EditLinkPayload) =>
      db.link.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )

  return async (data: EditLinkPayload) => {
    await editLink(data)
    const completeLink = await db?.link.findOne({ selector: { _id: data._id } }).exec()

    if (completeLink?.book && completeLink.type === DataSourceType.URI && data.resourceId) {
      refreshBookMetadata(completeLink.book)
    }
  }
}

export const useRemoveDanglingLinks = () => {
  const database = useDatabase()

  const removeDanglingLinks = useCallback(async (bookId: string) => {
    const book = await database?.book.safeFindOne({ selector: { _id: bookId } }).exec()

    if (book) {
      const [linkToNotRemove] = book.links

      if (linkToNotRemove) {
        const dangling = await database?.link.find({
          selector: {
            book: bookId,
            _id: {
              $ne: linkToNotRemove
            }
          }
        }).remove()

        Report.log(`Found ${dangling?.length} dangling links to remove from book ${bookId}`)
      }
    }
  }, [database])

  return removeDanglingLinks
}