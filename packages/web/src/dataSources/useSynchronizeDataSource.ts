import { ObokuErrorCode } from "@oboku/shared"
import { useNetworkState } from "react-use"
import { useMutation$, isDefined } from "reactjrx"
import { from, filter, switchMap, catchError, map, of } from "rxjs"
import { createDialog } from "../common/dialogs/createDialog"
import { httpClient } from "../http/httpClient"
import { usePluginSynchronize } from "../plugins/usePluginSynchronize"
import { useDatabase } from "../rxdb"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { useDataSourceIncrementalPatch } from "./useDataSourceIncrementalPatch"
import { Report } from "../debug/report.shared"
import { isPluginError } from "../errors/errors.shared"

export const useSynchronizeDataSource = () => {
  const { db: database } = useDatabase()
  const { mutateAsync: atomicUpdateDataSource } =
    useDataSourceIncrementalPatch()
  const synchronizeDataSource = usePluginSynchronize()
  const network = useNetworkState()
  const { mutateAsync: sync } = useSyncReplicate()

  return useMutation$({
    mutationFn: (_id: string) => {
      if (!network.online) {
        return createDialog({ preset: "OFFLINE" }).$
      }

      if (!database) {
        throw new Error("No database")
      }

      const datasource$ = from(
        database.datasource.findOne({ selector: { _id } }).exec(),
      )

      return datasource$.pipe(
        filter(isDefined),
        switchMap((dataSource) => from(synchronizeDataSource(dataSource))),
        switchMap((data) => {
          return from(
            atomicUpdateDataSource({
              id: _id,
              patch: {
                syncStatus: "fetching",
              },
            }),
          ).pipe(
            switchMap(() => from(sync([database.datasource]))),
            switchMap(() => from(httpClient.syncDataSource(_id, data.data))),
            catchError((e) =>
              from(
                atomicUpdateDataSource({
                  id: _id,
                  patch: {
                    syncStatus: null,
                    lastSyncErrorCode:
                      ObokuErrorCode.ERROR_DATASOURCE_NETWORK_UNREACHABLE,
                  },
                }),
              ).pipe(
                map((_) => {
                  throw e
                }),
              ),
            ),
          )
        }),
        catchError((e) => {
          if (isPluginError(e) && e.code === "cancelled") return of(null)

          Report.error(e)

          return of(null)
        }),
      )
    },
  })
}
