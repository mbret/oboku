import type { DataSourceDocType } from "@oboku/shared"
import type { ModifyFunction } from "rxdb"
import { switchMap, from } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"

export const useDataSourceIncrementalModify = () => {
  return useMutation$({
    mutationFn: ({
      id,
      mutationFunction,
    }: {
      id: string
      mutationFunction: ModifyFunction<DataSourceDocType>
    }) =>
      getLatestDatabase().pipe(
        switchMap((db) =>
          from(db.datasource.findOne(id).incrementalModify(mutationFunction)),
        ),
      ),
  })
}
