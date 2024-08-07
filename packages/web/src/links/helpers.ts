import { LinkDocType } from "@oboku/shared"
import { Database, useDatabase } from "../rxdb"
import { useCallback } from "react"
import { Report } from "../debug/report.shared"
import { from } from "rxjs"
import { useRefreshBookMetadata } from "../books/useRefreshBookMetadata"
import { UpdateQuery } from "rxdb"

type EditLinkPayload = Partial<LinkDocType> & Required<Pick<LinkDocType, "_id">>

export const useEditLink = () => {
  const { db } = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()

  return async (data: EditLinkPayload) => {
    const { _id, ...linkDataToUpate } = data

    await db?.link
      .findOne({ selector: { _id: data._id } })
      .update({ $set: linkDataToUpate } satisfies UpdateQuery<LinkDocType>)

    const completeLink = await db?.link
      .findOne({ selector: { _id: data._id } })
      .exec()

    if (completeLink?.book && completeLink.type === `URI` && data.resourceId) {
      refreshBookMetadata(completeLink.book)
    }
  }
}

export const useRemoveDanglingLinks = () => {
  const { db: database } = useDatabase()

  const removeDanglingLinks = useCallback(
    async (bookId: string) => {
      const book = await database?.book
        .findOne({ selector: { _id: bookId } })
        .exec()

      if (book) {
        const [linkToNotRemove] = book.links

        if (linkToNotRemove) {
          const dangling = await database?.link
            .find({
              selector: {
                book: bookId,
                _id: {
                  $ne: linkToNotRemove
                }
              }
            })
            .remove()

          Report.log(
            `Found ${dangling?.length} dangling links to remove from book ${bookId}`
          )
        }
      }
    },
    [database]
  )

  return removeDanglingLinks
}

export const getLinkById = (database: Database, id: string) =>
  from(
    database.collections.link
      .findOne({
        selector: {
          _id: id
        }
      })
      .exec()
  )
