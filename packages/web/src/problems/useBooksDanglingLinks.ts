import { difference } from "ramda"
import { useMemo } from "react"
import { useSubscribe$ } from "../common/rxjs/useSubscribe$"
import { useDatabase } from "../rxdb"

export const useBooksDanglingLinks = () => {
  const database = useDatabase()
  const { data: books = [] } = useSubscribe$(
    useMemo(() => database?.book.find().$, [database])
  )
  const { data: links = [] } = useSubscribe$(
    useMemo(() => database?.link.find().$, [database])
  )

  return useMemo(() => {
    return books.filter(
      (doc) =>
        difference(doc.links, links?.map((doc) => doc._id) ?? []).length > 0
    )
  }, [books, links])
}
