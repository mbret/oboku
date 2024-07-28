import { useMemo } from "react"
import { useBooks } from "../books/states"
import { useCollections } from "../collections/useCollections"
import { difference } from "lodash"
import { CollectionDocType } from "@oboku/shared"

export const useFixableCollections = () => {
  const { data: unsafeCollections } = useCollections({
    includeProtected: true
  })
  const { data: unsafeBooks } = useBooks({ includeProtected: true })
  const unsafeBookIds = useMemo(
    () => unsafeBooks?.map((item) => item._id),
    [unsafeBooks]
  )

  const collectionsWithDanglingBooks = unsafeCollections?.reduce(
    (acc, doc) => {
      const danglingBooks = difference(doc.books, unsafeBookIds ?? [])

      if (danglingBooks.length > 0) {
        return [
          ...acc,
          {
            doc,
            danglingBooks
          }
        ]
      }

      return acc
    },
    [] as { doc: CollectionDocType; danglingBooks: string[] }[]
  )

  return { collectionsWithDanglingBooks }
}
