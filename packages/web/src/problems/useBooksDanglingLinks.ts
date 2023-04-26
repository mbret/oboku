import { difference } from "ramda"
import { useMemo } from "react"
import { useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { switchMap } from "rxjs"

export const useBooksDanglingLinks = () => {
  const books = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db?.book.find().$)),
    []
  )
  const links = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db?.link.find().$)),
    []
  )

  return useMemo(() => {
    return books?.filter(
      (doc) =>
        difference(doc.links, links?.map((doc) => doc._id) ?? []).length > 0
    )
  }, [books, links])
}
