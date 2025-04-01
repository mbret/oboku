import { useMemo } from "react"
import { useBooks } from "../books/states"
import { useCollections } from "../collections/useCollections"
import { difference } from "@oboku/shared"
import type { CollectionDocType } from "@oboku/shared"

export const useFixableCollections = () => {
  const { data: unsafeCollections } = useCollections({
    includeProtected: true,
  })
  const { data: unsafeBooks } = useBooks({ includeProtected: true })
  const unsafeBookIds = useMemo(
    () => unsafeBooks?.map((item) => item._id),
    [unsafeBooks],
  )

  const collectionsWithDanglingBooks = unsafeCollections?.reduce(
    (acc, doc) => {
      const danglingItems = difference(doc.books, unsafeBookIds ?? [])

      if (danglingItems.length > 0) {
        return [
          ...acc,
          {
            doc,
            danglingItems,
          },
        ]
      }

      return acc
    },
    [] as { doc: CollectionDocType; danglingItems: string[] }[],
  )

  return { collectionsWithDanglingBooks }
}
