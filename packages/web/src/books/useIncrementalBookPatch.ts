import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import { RxDocument } from "rxdb"
import { BookDocType } from "@oboku/shared"
import { useMutation$ } from "reactjrx"

export const useIncrementalBookPatch = () =>
  useMutation$({
    mutationFn: ({
      doc,
      patch,
    }: {
      doc: RxDocument<BookDocType> | string
      patch: Partial<BookDocType>
    }) =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          typeof doc === "string"
            ? from(db.book.findOne({ selector: { _id: doc } }).exec())
            : of(doc),
        ),
        mergeMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalPatch(patch))
        }),
      ),
  })
