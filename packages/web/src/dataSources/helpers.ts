import { useAxiosClient } from "../axiosClient"
import { useDatabase } from "../rxdb"
import { DataSourceDocType, ObokuErrorCode } from "@oboku/shared"
import { useRxMutation } from "../rxdb/hooks"
import { Report } from "../debug/report.shared"
import { useRecoilCallback } from "recoil"
import { plugins } from "../plugins/configure"
import { useCallback, useMemo } from "react"
import { useDialogManager } from "../dialog"
import { useNetworkState } from "react-use"
import { useSync } from "../rxdb/useSync"
import { AtomicUpdateFunction } from "rxdb"
import { catchError, EMPTY, from, switchMap, map, of } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { usePluginSynchronize } from "../plugins/usePluginSynchronize"
import { isPluginError } from "@oboku/plugin-front"

export const useSynchronizeDataSource = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const { atomicUpdateDataSource } = useAtomicUpdateDataSource()
  const synchronizeDataSource = usePluginSynchronize()
  const network = useNetworkState()
  const dialog = useDialogManager()
  const sync = useSync()

  return useRecoilCallback(({ snapshot }) => async (_id: string) => {
    if (!network.online) {
      return dialog({ preset: "OFFLINE" })
    }

    if (!database) return

    from(database.datasource.findOne({ selector: { _id } }).exec())
      .pipe(
        isNotNullOrUndefined(),
        switchMap((dataSource) => synchronizeDataSource(dataSource)),
        switchMap((data) => {
          return atomicUpdateDataSource(_id, (old) => {
            old.syncStatus = `fetching`

            return old
          }).pipe(
            switchMap(() => sync([database.datasource])),
            switchMap(() => from(client.syncDataSource(_id, data.data))),
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
  })
}

export const useCreateDataSource = () => {
  type Payload = Omit<
    DataSourceDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const synchronize = useSynchronizeDataSource()
  const [createDataSource] = useRxMutation((db, variables: Payload) =>
    db?.datasource.post({ ...variables })
  )
  const network = useNetworkState()

  return async (
    data: Omit<
      Payload,
      "lastSyncedAt" | "createdAt" | "modifiedAt" | "syncStatus"
    >
  ) => {
    const dataSource = await createDataSource({
      ...data,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncStatus: null
    })
    if (network.online) {
      await synchronize(dataSource._id)
    }
  }
}

export const useRemoveDataSource = () =>
  useRxMutation((db, { id }: { id: string }) =>
    db.datasource.findOne({ selector: { _id: id } }).remove()
  )

export const useAtomicUpdateDataSource = () => {
  const database = useDatabase()

  const atomicUpdateDataSource = useCallback(
    (id: string, mutationFunction: AtomicUpdateFunction<DataSourceDocType>) =>
      of(database).pipe(
        isNotNullOrUndefined(),
        switchMap((db) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec())
        ),
        isNotNullOrUndefined(),
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
  useMemo(() => plugins.find((plugin) => plugin.type === type), [type])
