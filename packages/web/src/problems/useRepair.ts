import { BookDocType, CollectionDocType } from "@oboku/shared"
import { useMutation } from "reactjrx"
import { first, from, mergeMap, of } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { DeepReadonlyObject } from "rxdb"

export const useRepair = () => {
  return useMutation({
    mutationFn: (
      action:
        | {
            type: "collectionDanglingBooks"
            doc: CollectionDocType
            danglingItems: string[]
          }
        | {
            type: "bookDanglingCollections"
            doc: DeepReadonlyObject<BookDocType>
            danglingItems: string[]
          }
    ) => {
      const db$ = latestDatabase$.pipe(first())

      if (action.type === "collectionDanglingBooks") {
        const yes = window.confirm(
          `
            This action will remove the invalid book references from the collection. It will not remove anything else.
            `.replace(/  +/g, "")
        )

        if (!yes) return of(null)

        return db$.pipe(
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
                    (id) => !action.danglingItems.includes(id)
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

      if (action.type === "bookDanglingCollections") {
        const yes = window.confirm(
          `
            This action will remove the invalid collection references from the book. It will not remove anything else.
            `.replace(/  +/g, "")
        )

        if (!yes) return of(null)

        return db$.pipe(
          mergeMap((db) =>
            from(
              db.book.findOne({ selector: { _id: action.doc._id } }).exec()
            ).pipe(
              mergeMap((item) => {
                if (!item) return of(null)

                return item.incrementalModify((old) => {
                  const nonDanglingCollections = old.collections.filter(
                    (id) => !action.danglingItems.includes(id)
                  )

                  return {
                    ...old,
                    collections: nonDanglingCollections
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
