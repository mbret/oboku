import { DataSourceDocType } from "@oboku/shared"
import { useMutation } from "reactjrx"
import { first, switchMap, from, EMPTY } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

export const useDataSourceIncrementalPatch = () => {
  return useMutation({
    mutationFn: ({
      id,
      patch
    }: {
      id: string
      patch: Partial<DataSourceDocType>
    }) =>
      latestDatabase$.pipe(
        first(),
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec())
        ),
        switchMap((item) => {
          if (!item) return EMPTY

          return from(item.incrementalPatch(patch))
        })
      )
  })
}
