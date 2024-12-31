import { DataSourceDocType } from "@oboku/shared"
import { ModifyFunction } from "rxdb"
import { first, switchMap, from, of } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"

export const useDataSourceIncrementalModify = () => {
  return useMutation$({
    mutationFn: ({
      id,
      mutationFunction
    }: {
      id: string
      mutationFunction: ModifyFunction<DataSourceDocType>
    }) =>
      latestDatabase$.pipe(
        first(),
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec())
        ),
        switchMap((item) => {
          if (!item) return of(null)

          return from(item.incrementalModify(mutationFunction))
        })
      )
  })
}
