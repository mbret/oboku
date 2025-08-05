import type { DataSourceDocType } from "@oboku/shared"
import { switchMap, from, of } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"

export const useDataSourceIncrementalPatch = () => {
  return useMutation$({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<DataSourceDocType>
    }) =>
      getLatestDatabase().pipe(
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec()),
        ),
        switchMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalPatch(patch))
        }),
      ),
  })
}
