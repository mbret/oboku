import { useDatabase } from "../rxdb"
import { DataSourceDocType, ObokuErrorCode } from "@oboku/shared"
import { Report } from "../debug/report.shared"
import { plugins } from "../plugins/configure"
import { useCallback, useMemo } from "react"
import { useNetworkState } from "react-use"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { catchError, EMPTY, from, switchMap, map, of, filter } from "rxjs"
import { usePluginSynchronize } from "../plugins/usePluginSynchronize"
import { isDefined, useMutation } from "reactjrx"
import { isPluginError } from "../plugins/plugin-front"
import { getDataSourcePlugin } from "./getDataSourcePlugin"
import { httpClient } from "../http/httpClient"
import { createDialog } from "../common/dialogs/createDialog"

export const useSynchronizeDataSource = () => {
  const { db: database } = useDatabase()
  const { atomicUpdateDataSource } = useAtomicUpdateDataSource()
  const synchronizeDataSource = usePluginSynchronize()
  const network = useNetworkState()
  const { mutateAsync: sync } = useSyncReplicate()

  return useMutation({
    mutationFn: (_id: string) => {
      if (!network.online) {
        return createDialog({ preset: "OFFLINE" }).$
      }

      if (!database) {
        throw new Error("No database")
      }

      const datasource$ = from(
        database.datasource.findOne({ selector: { _id } }).exec()
      )

      return datasource$.pipe(
        filter(isDefined),
        switchMap((dataSource) => from(synchronizeDataSource(dataSource))),
        switchMap((data) => {
          return atomicUpdateDataSource(_id, (old) => {
            old.syncStatus = `fetching`

            return old
          }).pipe(
            switchMap(() => from(sync([database.datasource]))),
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
    }
  })
}

export const useCreateDataSource = () => {
  type Payload = Omit<
    DataSourceDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const { db } = useDatabase()
  const { mutateAsync: synchronize } = useSynchronizeDataSource()
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
    (id: string, mutationFunction: any) =>
      of(database).pipe(
        filter(isDefined),
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec())
        ),
        filter(isDefined),
        switchMap((item) => from(item.incrementalModify(mutationFunction)))
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
