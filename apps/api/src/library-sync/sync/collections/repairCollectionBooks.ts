import { Logger } from "@nestjs/common"
import type nano from "nano"
import { difference } from "@oboku/shared"
import type { Context } from "../types.js"
import { atomicUpdate, find, findOne } from "../../../couch/dbHelpers.js"

const logger = new Logger("sync/repairCollectionBooks")

/**
 * Adds to the collection each book that lists the collection but that the
 * collection does not list.
 *
 * It removes no id from the collection, even the id of a deleted book: a
 * rewrite can drop a device's unpushed edit to the collection.
 */
export const repairCollectionBooks = async ({
  ctx,
  collectionId,
}: {
  ctx: Pick<Context, "syncReport"> & {
    db: Pick<nano.DocumentScope<unknown>, "find" | "get" | "insert">
  }
  collectionId: string
}) => {
  const collection = await findOne(
    "obokucollection",
    {
      selector: { _id: collectionId },
    },
    {
      db: ctx.db,
    },
  )

  if (collection) {
    const booksHavingCollectionAttached = await find(ctx.db, `book`, {
      selector: {
        collections: {
          $elemMatch: {
            $eq: collection._id,
          },
        },
      },
    })

    const missingsBooksInCollection = difference(
      booksHavingCollectionAttached.map(({ _id }) => _id),
      collection.books,
    )

    if (missingsBooksInCollection.length > 0) {
      logger.log(
        `${collectionId} has ${missingsBooksInCollection.join(`,`)} missed books`,
      )

      await atomicUpdate(ctx.db, "obokucollection", collection._id, (old) => ({
        ...old,
        books: [...new Set([...missingsBooksInCollection, ...old.books])],
      }))

      ctx.syncReport.addBooksToCollection({
        collection,
        books: missingsBooksInCollection.map((_id) => ({ _id })),
      })
    }
  }
}
