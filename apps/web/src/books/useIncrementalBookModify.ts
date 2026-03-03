import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import type { ModifyFunction, RxDocument } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"

export const useIncrementalBookModify = () =>
  useMutation$({
    mutationFn: ({
      doc,
      mutationFn,
    }: {
      doc: RxDocument<BookDocType> | string
      mutationFn: ModifyFunction<BookDocType>
    }) =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          typeof doc === "string"
            ? from(db.book.findOne({ selector: { _id: doc } }).exec())
            : of(doc),
        ),
        mergeMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalModify(mutationFn))
        }),
      ),
  })
