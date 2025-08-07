import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import type { RxDocument, UpdateQuery } from "rxdb"
import type { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"

export const useIncrementalBookUpdate = () =>
  useMutation$({
    mutationFn: ({
      doc,
      updateObj,
    }: {
      doc: RxDocument<BookDocType> | string
      updateObj: UpdateQuery<BookDocType>
    }) =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          typeof doc === "string"
            ? from(db.book.findOne({ selector: { _id: doc } }).exec())
            : of(doc),
        ),
        mergeMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalUpdate(updateObj))
        }),
      ),
  })
