import { CollectionDocType } from "@oboku/shared"
import { useMutation } from "reactjrx"
import { first, from, mergeMap, of } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

export const useRepair = () => {
  return useMutation({
    mutationFn: (action: {
      type: "collectionDanglingBooks"
      doc: CollectionDocType
      danglingBooks: string[]
    }) => {
      if (action.type === "collectionDanglingBooks") {
        const yes = window.confirm(
          `
            This action will remove the invalid book references from the collection. It will not remove anything else.
            `.replace(/  +/g, "")
        )

        if (!yes) return of(null)

        return latestDatabase$.pipe(
          first(),
          mergeMap((db) =>
            from(
              db.obokucollection
                .findOne({ selector: { _id: action.doc._id } })
                .exec()
            ).pipe(
              mergeMap((item) => {
                if (!item) return of(null)

                return item.incrementalModify((old) => {
                  const nonDanglingBooks = old.books.filter(
                    (id) => !action.danglingBooks.includes(id)
                  )

                  return {
                    ...old,
                    books: nonDanglingBooks
                  }
                })
              })
            )
          )
        )
      }

      return of(null)
    }
  })
}
