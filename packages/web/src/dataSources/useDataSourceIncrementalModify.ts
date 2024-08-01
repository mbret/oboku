import { DataSourceDocType } from "@oboku/shared"
import { useMutation } from "reactjrx"
import { ModifyFunction } from "rxdb"
import { first, switchMap, from, EMPTY } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

export const useDataSourceIncrementalModify = () => {
  return useMutation({
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
          if (!item) return EMPTY

          return from(item.incrementalModify(mutationFunction))
        })
      )
  })
}
