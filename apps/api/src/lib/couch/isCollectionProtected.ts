import type createNano from "nano"
import { find } from "./dbHelpers"
import { findTags } from "./findTags"

/**
 * A collection is considered protected when at least one of its books carries
 * a protected tag. Mirrors {@link isBookProtected} but resolves through the
 * collection's `books` array.
 */
export const isCollectionProtected = async (
  db: createNano.DocumentScope<unknown>,
  collection: { books: string[] },
) => {
  if (!collection.books.length) return false

  const protectedTags = await findTags(db, {
    selector: { isProtected: true },
    fields: ["_id"],
  })

  if (!protectedTags.length) return false

  const protectedTagIds = protectedTags.map(({ _id }) => _id)

  const docs = await find(db, "book", {
    selector: {
      _id: { $in: collection.books },
      tags: { $in: protectedTagIds },
    },
    fields: ["_id"],
    limit: 1,
  })

  return docs.length > 0
}
