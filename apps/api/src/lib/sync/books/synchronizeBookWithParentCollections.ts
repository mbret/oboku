import { find } from "src/lib/couch/dbHelpers"
import { Logger } from "@nestjs/common"
import type {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/lib/plugins/types"
import type { BookDocType } from "@oboku/shared"
import type nano from "nano"

const logger = new Logger("synchronizeBookWithParentCollections")

type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0] & {
  db: nano.DocumentScope<unknown>
}
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]
type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]

/**
 * For every parents of the book we will lookup if there are collections that exist without
 * referencing it. If so then we will attach the collection and the book together
 */
export const synchronizeBookWithParentCollections = async (
  book: Partial<BookDocType> & { _id: string },
  parents: SynchronizeAbleItem[],
  helpers: Helpers,
  context: Context,
) => {
  const parentResourceIds = parents?.map((parent) => parent.resourceId) || []

  console.log(
    `[synchronizeBookWithParentCollections]`,
    `${book._id} with ${parentResourceIds.length} parentResourceIds ${parentResourceIds}`,
  )

  // Retrieve all the new collection to which attach the book and add the book in the list
  // if there is no collection we don't run the query since it will return everything because of the empty $or
  if (parentResourceIds.length > 0) {
    /**
     * Use case:
     * Some collections does not have the book yet
     *
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const collectionsThatHaveNotThisBookAsReferenceYet = await find(
      context.db,
      "obokucollection",
      {
        selector: {
          $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId })),
          books: {
            $nin: [book._id],
          },
        },
      },
    )

    if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
      logger.log(
        `synchronizeBookWithParentCollections ${collectionsThatHaveNotThisBookAsReferenceYet.length} collections does not have ${book._id} attached to them yet`,
      )

      await Promise.all(
        collectionsThatHaveNotThisBookAsReferenceYet.map((collection) => {
          helpers.atomicUpdate("obokucollection", collection._id, (old) => ({
            ...old,
            books: [...old.books.filter((id) => id !== book._id), book._id],
          }))

          context.syncReport.addBooksToCollection({
            collection,
            books: [{ _id: book._id }],
          })
        }),
      )
    }

    const parentCollections = await find(context.db, "obokucollection", {
      selector: {
        $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId })),
      },
    })
    const parentCollectionIds = parentCollections.map(({ _id }) => _id)

    /**
     * Use case:
     * The book does not have one of the parent collection yet
     *
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const bookWithCollections = await helpers.findOne("book", {
      selector: { _id: book._id },
      fields: [`collections`, `_id`],
    })

    if (!bookWithCollections) return

    const { collections: bookCollections } = bookWithCollections

    const collectionsNotInBookYet = parentCollections.filter(
      ({ _id }) => !bookCollections.includes(_id),
    )

    if (collectionsNotInBookYet.length) {
      logger.log(
        `synchronizeBookWithParentCollections ${book._id} has some missing parent collections. It will be updated to include them`,
      )

      await helpers.atomicUpdate("book", book._id, (old) => ({
        ...old,
        collections: [...new Set([...old.collections, ...parentCollectionIds])],
      }))

      context.syncReport.addCollectionsToBook({
        book,
        collections: collectionsNotInBookYet,
      })
    }
  }

  /**
   * Use case:
   * The book does not have parent collections
   *
   * Result:
   * We do not remove collection yet. See for the future
   */
  if (parentResourceIds.length === 0) {
    // @todo remove collections from the book ?
  }
}
