import { Logger } from "@nestjs/common"
import {
  type CollectionCandidate,
  type DataSourcePlugin,
  type SynchronizeAbleDataSource,
} from "src/features/plugins/types"
import type { BookDocType } from "@oboku/shared"
import type { Context } from "../types"

const logger = new Logger("synchronizeBookWithParentCollections")

type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]
type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]

/**
 * For every parent of the book we look up collections that match each parent (same resource / link data)
 * via getCollectionCandidatesForItem, pick the one that uses the current datasource's credentials,
 * then attach the book and those collections together.
 */
export const synchronizeBookWithParentCollections = async (
  book: Partial<BookDocType> & { _id: string },
  parents: SynchronizeAbleItem[],
  helpers: Helpers,
  context: Context,
) => {
  if (parents.length === 0) {
    // @todo remove collections from the book ?
    return
  }

  logger.log(
    `[synchronizeBookWithParentCollections] ${book._id} with ${parents.length} parents`,
  )

  const collectionResults = await Promise.all(
    parents.map((parent) =>
      context.plugin.getCollectionCandidatesForItem(parent, context),
    ),
  )

  const collectionById = new Map<string, CollectionCandidate>()

  for (const { collections } of collectionResults) {
    const best =
      collections.find((c) => c.isUsingSameProviderCredentials) ??
      collections[0]

    if (best) collectionById.set(best._id, best)
  }

  const parentCollections = Array.from(collectionById.values())

  /**
   * Use case:
   * Some collections do not have the book yet.
   *
   * Result:
   * We attach the book to those collections and add the book in their list.
   */
  const collectionsThatHaveNotThisBookAsReferenceYet = parentCollections.filter(
    (c) => !c.books.includes(book._id),
  )

  if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
    logger.log(
      `synchronizeBookWithParentCollections ${collectionsThatHaveNotThisBookAsReferenceYet.length} collections do not have ${book._id} attached to them yet`,
    )

    await Promise.all(
      collectionsThatHaveNotThisBookAsReferenceYet.map(async (collection) => {
        await helpers.atomicUpdate(
          "obokucollection",
          collection._id,
          (old) => ({
            ...old,
            books: [...old.books.filter((id) => id !== book._id), book._id],
          }),
        )

        context.syncReport.addBooksToCollection({
          collection,
          books: [{ _id: book._id }],
        })
      }),
    )
  }

  const parentCollectionIds = parentCollections.map(({ _id }) => _id)

  /**
   * Use case:
   * The book does not have one of the parent collections yet.
   *
   * Result:
   * We attach all the parent collections to the book.
   */
  const bookWithCollections = await helpers.findOne("book", {
    selector: { _id: book._id },
    fields: ["collections", "_id"],
  })

  if (!bookWithCollections) return

  const { collections: bookCollections } = bookWithCollections

  const collectionsNotInBookYet = parentCollections.filter(
    ({ _id }) => !bookCollections.includes(_id),
  )

  if (collectionsNotInBookYet.length > 0) {
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
