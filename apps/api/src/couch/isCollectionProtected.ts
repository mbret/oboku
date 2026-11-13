import type createNano from "nano"
import { findOne } from "./dbHelpers.js"
import { findProtectedTagIds } from "./findProtectedTagIds.js"

/**
 * A collection is considered protected when at least one of its books carries
 * a protected tag. Mirrors `isBookProtected` from `@oboku/shared`, but
 * resolves through the collection's `books` array.
 */
export const isCollectionProtected = async (
  db: createNano.DocumentScope<unknown>,
  collection: { books: string[] },
) => {
  if (!collection.books.length) return false

  const protectedTagIds = await findProtectedTagIds(db)

  if (!protectedTagIds.length) return false

  const protectedBook = await findOne(
    "book",
    {
      selector: {
        _id: { $in: collection.books },
        tags: { $in: protectedTagIds },
      },
      fields: ["_id"],
    },
    { db },
  )

  return protectedBook !== null
}
