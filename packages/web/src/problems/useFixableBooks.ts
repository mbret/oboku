import { useMemo } from "react"
import { useBooks } from "../books/states"
import { useCollections } from "../collections/useCollections"
import { difference } from "@oboku/shared"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { useLinks } from "../links/states"

export const useFixableBooks = () => {
  const { data: unsafeCollections } = useCollections({
    includeProtected: true
  })
  const { data: unsafeBooks } = useBooks({ includeProtected: true })
  const { data: links } = useLinks()

  const unsafeCollectionIds = useMemo(
    () => unsafeCollections?.map((item) => item._id),
    [unsafeCollections]
  )
  const linkIds = useMemo(() => links?.map((item) => item._id), [links])

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

  const booksWithDanglingLinks = unsafeBooks?.reduce(
    (acc, doc) => {
      const danglingItems = difference(doc.links, linkIds ?? [])

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

  return { booksWithDanglingCollections, booksWithDanglingLinks }
}
