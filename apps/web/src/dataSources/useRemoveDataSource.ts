import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { defaultIfEmpty, first, from, mergeMap } from "rxjs"
import { withDialog } from "../common/dialogs/withDialog"
import { observeDataSourceById } from "./dbHelpers"
import { withUnknownErrorDialog } from "../errors/withUnknownErrorDialog"
import { useMutation$ } from "reactjrx"

export const useRemoveDataSource = () => {
  return useMutation$({
    mutationFn: ({ id }: { id: string }) =>
      getLatestDatabase().pipe(
        withDialog({ preset: "CONFIRM" }),
        mergeMap(([db]) =>
          observeDataSourceById(db, id).pipe(
            first(),
            mergeMap((dataSource) => {
              if (!dataSource) throw new Error("Invalid data source")
              return from(dataSource.remove())
            }),
          ),
        ),
        withUnknownErrorDialog(),
        defaultIfEmpty(null),
      ),
  })
}
