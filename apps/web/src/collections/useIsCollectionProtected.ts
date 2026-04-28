import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { isBookProtected, useBooks } from "../books/states"
import { useProtectedTagIds } from "../tags/helpers"

/**
 * A collection is protected when at least one of its books carries a tag with
 * `isProtected: true`. Mirrors `useIsBookProtected` but resolves through the
 * collection's `books` array.
 */
export const useIsCollectionProtected = (
  collection?: Pick<DeepReadonlyObject<CollectionDocType>, "books"> | null,
) => {
  const enabled = !!collection
  const bookIds = collection?.books

  const { data: protectedTagIds } = useProtectedTagIds({ enabled })
  const { data: books, ...rest } = useBooks({
    ids: bookIds,
    includeProtected: true,
    enabled,
  })

  const data =
    !enabled || protectedTagIds === undefined || books === undefined
      ? undefined
      : protectedTagIds.length === 0
        ? false
        : books.some((book) => isBookProtected(protectedTagIds, book))

  return { ...rest, data }
}
