import { useDatabase } from "../rxdb"
import { DataSourceDocType, ObokuErrorCode } from "@oboku/shared"
import { Report } from "../debug/report.shared"
import { plugins } from "../plugins/configure"
import { useCallback, useMemo } from "react"
import { useDialogManager } from "../dialog"
import { useNetworkState } from "react-use"
import { useSync } from "../rxdb/useSync"
import { AtomicUpdateFunction } from "rxdb"
import { catchError, EMPTY, from, switchMap, map, of, filter } from "rxjs"
import { usePluginSynchronize } from "../plugins/usePluginSynchronize"
import { isDefined, useMutation } from "reactjrx"
import { isPluginError } from "../plugins/plugin-front"
import { getDataSourcePlugin } from "./getDataSourcePlugin"
import { httpClient } from "../http/httpClient"

export const useSynchronizeDataSource = () => {
  const { db: database } = useDatabase()
  const { atomicUpdateDataSource } = useAtomicUpdateDataSource()
  const synchronizeDataSource = usePluginSynchronize()
  const network = useNetworkState()
  const dialog = useDialogManager()
  const sync = useSync()

  return useCallback(
    async (_id: string) => {
      if (!network.online) {
        return dialog({ preset: "OFFLINE" })
      }

      if (!database) return

      from(database.datasource.findOne({ selector: { _id } }).exec())
        .pipe(
          filter(isDefined),
          switchMap((dataSource) => synchronizeDataSource(dataSource)),
          switchMap((data) => {
            return atomicUpdateDataSource(_id, (old) => {
              old.syncStatus = `fetching`

              return old
            }).pipe(
              switchMap(() => sync([database.datasource])),
              switchMap(() => from(httpClient.syncDataSource(_id, data.data))),
              catchError((e) =>
                atomicUpdateDataSource(_id, (old) => ({
                  ...old,
                  syncStatus: null,
                  lastSyncErrorCode:
                    ObokuErrorCode.ERROR_DATASOURCE_NETWORK_UNREACHABLE
                })).pipe(
                  map((_) => {
                    throw e
                  })
                )
              )
            )
          }),
          catchError((e) => {
            if (isPluginError(e) && e.code === "cancelled") return EMPTY

            Report.error(e)

            return EMPTY
          })
        )
        .subscribe()
    },
    [
      atomicUpdateDataSource,
      database,
      dialog,
      network,
      sync,
      synchronizeDataSource
    ]
  )
}

export const useCreateDataSource = () => {
  type Payload = Omit<
    DataSourceDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const { db } = useDatabase()
  const synchronize = useSynchronizeDataSource()
  const network = useNetworkState()

  return async (
    data: Omit<
      Payload,
      "lastSyncedAt" | "createdAt" | "modifiedAt" | "syncStatus"
    >
  ) => {
    const dataSource = await db?.datasource.post({
      ...data,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncStatus: null
    })

    if (dataSource && network.online) {
      await synchronize(dataSource._id)
    }
  }
}

export const useRemoveDataSource = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      db?.datasource.findOne({ selector: { _id: id } }).remove()
  })
}

export const useAtomicUpdateDataSource = () => {
  const { db: database } = useDatabase()

  const atomicUpdateDataSource = useCallback(
    (id: string, mutationFunction: AtomicUpdateFunction<DataSourceDocType>) =>
      of(database).pipe(
        filter(isDefined),
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec())
        ),
        filter(isDefined),
        switchMap((item) => from(item.atomicUpdate(mutationFunction)))
      ),
    [database]
  )

  return { atomicUpdateDataSource }
}

export const useDataSourceHelpers = (
  idOrObj:
    | (typeof plugins)[number]["uniqueResourceIdentifier"]
    | { uniqueResourceIdentifier: string }
) => {
  const id =
    typeof idOrObj === `string` ? idOrObj : idOrObj.uniqueResourceIdentifier

  return useMemo(
    () => ({
      generateResourceId: (resourceId: string) => `${id}-${resourceId}`,
      extractIdFromResourceId: (resourceId: string) =>
        resourceId.replace(`${id}-`, ``)
    }),
    [id]
  )
}

export const useDataSourcePlugin = (type?: string) =>
  useMemo(() => getDataSourcePlugin(type), [type])
