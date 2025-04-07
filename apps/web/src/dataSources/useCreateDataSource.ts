import type { DataSourceDocType } from "@oboku/shared"
import { useNetworkState } from "react-use"
import { useSynchronizeDataSource } from "./useSynchronizeDataSource"
import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"

export const useCreateDataSource = () => {
  type Payload = Omit<
    DataSourceDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const { mutateAsync: synchronize } = useSynchronizeDataSource()
  const network = useNetworkState()

  return useMutation$({
    mutationFn: (
      data: Omit<
        Payload,
        "lastSyncedAt" | "createdAt" | "modifiedAt" | "syncStatus"
      >,
    ) =>
      getLatestDatabase().pipe(
        switchMap((db) => {
          const dataSource$ = from(
            db.datasource.post({
              ...data,
              lastSyncedAt: null,
              createdAt: new Date().toISOString(),
              modifiedAt: null,
              syncStatus: null,
            }),
          )

          return dataSource$
        }),
      ),
    onSuccess: (dataSource) => {
      if (dataSource && network.online) {
        synchronize(dataSource._id)
      }
    },
  })
}
