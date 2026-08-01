import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, mergeMap, of } from "rxjs"
import type { RxDocument } from "rxdb"
import type { BookDocType } from "@oboku/shared"

export const incrementalBookMutation = <Result>(
  doc: RxDocument<BookDocType> | string,
  applyIncremental: (item: RxDocument<BookDocType>) => Promise<Result>,
) =>
  getLatestDatabase().pipe(
    mergeMap((db) =>
      typeof doc === "string"
        ? from(db.book.findOne({ selector: { _id: doc } }).exec())
        : of(doc),
    ),
    mergeMap((item) => {
      if (!item) return of(null)

      return from(applyIncremental(item))
    }),
  )
