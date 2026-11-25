import type { LibrarySyncDocType } from "@oboku/shared"
import type { ModifyFunction } from "rxdb"
import { switchMap, from } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"

export const useLibrarySyncIncrementalModify = () => {
  return useMutation$({
    mutationFn: ({
      id,
      mutationFunction,
    }: {
      id: string
      mutationFunction: ModifyFunction<LibrarySyncDocType>
    }) =>
      getLatestDatabase().pipe(
        switchMap((db) =>
          from(db.datasource.findOne(id).incrementalModify(mutationFunction)),
        ),
      ),
  })
}
