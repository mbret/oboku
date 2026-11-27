import { Logger } from "@nestjs/common"
import type nano from "nano"
import { difference } from "@oboku/shared"
import type { Context } from "../types.js"
import { atomicUpdate, find, findOne } from "../../../couch/dbHelpers.js"
import { fetchDocumentStates } from "../../../couch/fetchDocumentStates.js"

const logger = new Logger("sync/repairCollectionBooks")

/**
 * Try to repair books links
 *
 * @important
 * We don't do the repair on client side automatically since these issues can
 * appear during partial / incomplete / errored sync. We cannot reliably detect when
 * we can do the repairs ourselves. The sync can do these repairs safely.
 *
 * @scenario 1
 * The collection lists a book that CouchDB holds as deleted. We remove it from
 * the collection. A book CouchDB has never seen stays: a device may not have
 * pushed it yet.
 *
 * @scenario 2
 * The book has the collection attached but not the collection. We need to reattach it to the
 * collection.
 */
export const repairCollectionBooks = async ({
  ctx,
  collectionId,
}: {
  ctx: Pick<Context, "syncReport"> & {
    db: Pick<
      nano.DocumentScope<unknown>,
      "find" | "get" | "insert" | "fetchRevs"
    >
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
    const [booksHavingCollectionAttached, { deletedIds }] = await Promise.all([
      find(ctx.db, `book`, {
        selector: {
          collections: {
            $elemMatch: {
              $eq: collection._id,
            },
          },
        },
      }),
      fetchDocumentStates(ctx.db, collection.books),
    ])

    const missingsBooksInCollection = difference(
      booksHavingCollectionAttached.map(({ _id }) => _id),
      collection.books,
    )

    const deletedBookIds = collection.books.filter((id) => deletedIds.has(id))

    if (missingsBooksInCollection.length > 0 || deletedBookIds.length > 0) {
      logger.log(
        `${collectionId} has ${missingsBooksInCollection.join(`,`)} missed books and ${deletedBookIds.join(`,`)} deleted books`,
      )

      await atomicUpdate(ctx.db, "obokucollection", collection._id, (old) => ({
        ...old,
        books: [
          ...new Set([
            ...missingsBooksInCollection,
            ...old.books.filter((id) => !deletedBookIds.includes(id)),
          ]),
        ],
      }))

      if (deletedBookIds.length > 0) {
        ctx.syncReport.removeBooksFromCollection({
          collection,
          books: deletedBookIds.map((_id) => ({ _id })),
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
