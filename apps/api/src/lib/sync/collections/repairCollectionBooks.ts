import { Logger } from "@nestjs/common"
import { difference } from "@oboku/shared"
import type { Context } from "../types"
import { atomicUpdate, find, findOne } from "src/lib/couch/dbHelpers"

const logger = new Logger("sync/repairCollectionBooks")

/**
 * Try to repair books links
 *
 * @important
 * We don't do the repair on client side automatically since these issues can
 * appear during partial / incomplete / errored sync. We cannot reliably detect when
 * we can do the repairs ourselves. The repairs can be safely done on sync or on repair
 * page on the web app.
 *
 * @scenario 1
 * The book does not exist anymore or is not attached to the collection but the collection
 * still have the book attached. We need to remove it from the collection.
 *
 * @scenario 2
 * The book has the collection attached but not the collection. We need to reattach it to the
 * collection.
 */
export const repairCollectionBooks = async ({
  ctx,
  collectionId,
}: {
  ctx: Context
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
    const [booksHavingCollectionAttached, booksFromCollectionList] =
      await Promise.all([
        find(ctx.db, `book`, {
          selector: {
            collections: {
              $elemMatch: {
                $eq: collection._id,
              },
            },
          },
          /**
           * @todo If a collection have more than 999 books we have a problem.
           * We need to find a safer way to detect anomaly.
           */
          limit: 999,
        }),
        find(ctx.db, `book`, {
          selector: { _id: { $in: collection?.books || [] } },
          /**
           * @todo If a collection have more than 999 books we have a problem.
           * We need to find a safer way to detect anomaly.
           */
          limit: 999,
        }),
      ])

    const missingsBooksInCollection = difference(
      booksHavingCollectionAttached.map(({ _id }) => _id),
      collection.books,
    )

    const danglingBooks = difference(
      collection.books,
      booksFromCollectionList.map(({ _id }) => _id),
    )

    if (missingsBooksInCollection.length > 0 || danglingBooks.length > 0) {
      logger.log(
        `${collectionId} has ${missingsBooksInCollection.join(`,`)} missed books and ${danglingBooks.join(`,`)} dangling books`,
      )

      await atomicUpdate(ctx.db, "obokucollection", collection._id, (old) => ({
        ...old,
        books: [
          ...new Set([
            ...missingsBooksInCollection,
            ...old.books.filter((id) => !danglingBooks.includes(id)),
          ]),
        ],
      }))

      if (danglingBooks.length > 0) {
        ctx.syncReport.removeBooksFromCollection({
          collection,
          books: danglingBooks.map((_id) => ({ _id })),
        })
      }

      if (missingsBooksInCollection.length > 0) {
        ctx.syncReport.addBooksToCollection({
          collection,
          books: missingsBooksInCollection.map((_id) => ({ _id })),
        })
      }
    }
  }
}
