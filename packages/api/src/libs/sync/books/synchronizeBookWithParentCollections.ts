import { Logger } from "@libs/logger"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"

const logger = Logger.child({ module: "synchronizeBookWithParentCollections" })

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

/**
 * For every parents of the book we will lookup if there are collections that exist without
 * referencing it. If so then we will attach the collection and the book together
 */
export const synchronizeBookWithParentCollections = async (
  bookId: string,
  parents: SynchronizeAbleItem[],
  helpers: Helpers
) => {
  const parentResourceIds = parents?.map((parent) => parent.resourceId) || []

  logger.info(
    `${bookId} with ${parentResourceIds.length} parentResourceIds ${parentResourceIds}`
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
    const collectionsThatHaveNotThisBookAsReferenceYet = await helpers.find(
      "obokucollection",
      {
        selector: {
          $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId })),
          books: {
            $nin: [bookId]
          }
        }
      }
    )

    if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
      logger.info(
        `synchronizeBookWithParentCollections ${collectionsThatHaveNotThisBookAsReferenceYet.length} collections does not have ${bookId} attached to them yet`
      )
      await Promise.all(
        collectionsThatHaveNotThisBookAsReferenceYet.map((collection) =>
          helpers.atomicUpdate("obokucollection", collection._id, (old) => ({
            ...old,
            books: [...old.books.filter((id) => id !== bookId), bookId]
          }))
        )
      )
    }

    const parentCollections = await helpers.find("obokucollection", {
      selector: {
        $or: parentResourceIds.map((linkResourceId) => ({ linkResourceId }))
      }
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
    const { collections: bookCollections } =
      (await helpers.findOne("book", {
        selector: { _id: bookId },
        fields: [`collections`]
      })) || {}

    if (bookCollections) {
      const bookHasNotOneOfTheCollectionsYet = parentCollectionIds.some(
        (collectionId) => !bookCollections.includes(collectionId)
      )
      if (bookHasNotOneOfTheCollectionsYet) {
        logger.info(
          `synchronizeBookWithParentCollections ${bookId} has some missing parent collections. It will be updated to include them`
        )
        await helpers.atomicUpdate("book", bookId, (old) => ({
          ...old,
          collections: [
            ...new Set([...old.collections, ...parentCollectionIds])
          ]
        }))
      }
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
