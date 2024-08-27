import { Logger } from "@libs/logger"
import { DataSourcePlugin } from "@libs/plugins/types"
import { difference } from "lodash"
import { Context } from "../types"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]

const logger = Logger.child({ module: "sync/repairCollectionBooks" })

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
  helpers,
  ctx,
  collectionId
}: {
  ctx: Context
  helpers: Helpers
  collectionId: string
}) => {
  const collection = await helpers.findOne("obokucollection", {
    selector: { _id: collectionId }
  })

  if (collection) {
    const booksHavingThisCollectionAttached = await helpers.find("book", {
      selector: { _id: { $in: collection?.books || [] } },
      /**
       * @todo If a collection have more than 999 books we have a problem.
       * We need to find a safer way to detect anomaly.
       */
      limit: 999
    })

    const bookIdsHavingThisCollectionAttached =
      booksHavingThisCollectionAttached.map(({ _id }) => _id)

    const missingsBooksInCollection = difference(
      bookIdsHavingThisCollectionAttached,
      collection.books
    )

    const danglingBooks = difference(
      collection.books,
      bookIdsHavingThisCollectionAttached
    )

    if (missingsBooksInCollection.length > 0 || danglingBooks.length > 0) {
      logger.info(
        `${collectionId} has ${missingsBooksInCollection.join(`,`)} missed books and ${danglingBooks.join(`,`)} dangling books`
      )

      await helpers.atomicUpdate("obokucollection", collection._id, (old) => ({
        ...old,
        books: [
          ...missingsBooksInCollection,
          ...old.books.filter((id) => !danglingBooks.includes(id))
        ]
      }))

      if (danglingBooks.length > 0) {
        ctx.syncReport.removeBooksFromCollection({
          collection,
          books: danglingBooks.map((_id) => ({ _id }))
        })
      }

      if (missingsBooksInCollection.length > 0) {
        ctx.syncReport.addBooksToCollection({
          collection,
          books: missingsBooksInCollection.map((_id) => ({ _id }))
        })
      }
    }
  }
}
