import { useMemo } from "react"
import { useBooks } from "../books/states"
import { useCollections } from "../collections/useCollections"
import { difference } from "lodash"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

export const useFixableBooks = () => {
  const { data: unsafeCollections } = useCollections({
    includeProtected: true
  })
  const { data: unsafeBooks } = useBooks({ includeProtected: true })

  const unsafeCollectionIds = useMemo(
    () => unsafeCollections?.map((item) => item._id),
    [unsafeCollections]
  )

  const booksWithDanglingCollections = unsafeBooks?.reduce(
    (acc, doc) => {
      const danglingItems = difference(
        doc.collections,
        unsafeCollectionIds ?? []
      )

      if (danglingItems.length > 0) {
        return [
          ...acc,
          {
            doc,
            danglingItems
          }
        ]
      }

      return acc
    },
    [] as { doc: DeepReadonlyObject<BookDocType>; danglingItems: string[] }[]
  )

  return { booksWithDanglingCollections }
}
