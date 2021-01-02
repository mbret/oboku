import { first } from "rxjs/operators"
import { useAxiosClient } from "../axiosClient"
import { useDatabase } from "../rxdb"
import { DataSourceDocType, DataSourceType } from 'oboku-shared'
import { useRxMutation } from "../rxdb/hooks"
import { Report } from "../report"
import { useRecoilCallback } from "recoil"
import { useGetLazySignedGapi } from "./google/helpers"
import { plugins } from "./configure"
import { useCallback, useMemo, useRef } from "react"
import plugin from "pouchdb"

export const useSynchronizeDataSource = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateDataSource] = useUpdateDataSource()
  const [getLazySignedGapi] = useGetLazySignedGapi()

  return useRecoilCallback(({ snapshot }) => async (_id: string) => {
    const dataSource = await database?.datasource.findOne({ selector: { _id } }).exec()

    switch (dataSource?.type) {
      case DataSourceType.DRIVE: {
        const { credentials } = (await getLazySignedGapi()) || {}
        await updateDataSource({ _id, lastSyncedAt: null, lastSyncErrorCode: null })
        database?.sync({
          collectionNames: ['datasource'],
          syncOptions: () => ({
            remote: client.getPouchDbRemoteInstance(),
            direction: {
              push: true,
            },
            options: {
              retry: false,
              live: false,
              timeout: 5000,
            }
          })
        })
          .complete$
          .pipe(first())
          .subscribe(completed => {
            completed && client.syncDataSource(_id, credentials).catch(Report.error)
          })
        break
      }
      default:
    }
  })
}

// export const useRenewDataSourceCredentials = () => {
//   const [updateDataSource] = useUpdateDataSource()
//   const [getLazySignedGapi] = useGetLazySignedGapi()
//   const database = useDatabase()

//   return useRecoilCallback(({ snapshot }) => async (id: string) => {
//     const dataSource = await database?.datasource.findOne({ selector: { _id: id } }).exec()

//     switch (dataSource?.type) {
//       case DataSourceType.DRIVE: {
//         const { credentials } = (await getLazySignedGapi()) || {}
//         await updateDataSource({
//           _id: id,
//           credentials: credentials
//         })
//         break
//       }
//       default:
//     }
//   })
// }

export const useCreateDataSource = () => {
  type Payload = Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>
  const synchronize = useSynchronizeDataSource()
  const [createDataSource] = useRxMutation((db, variables: Payload) => db?.datasource.post({ ...variables }))

  return async (data: Payload) => {
    const dataSource = await createDataSource(data)
    await synchronize(dataSource._id)
  }
}

export const useRemoveDataSource = () =>
  useRxMutation((db, { id }: { id: string }) => db.datasource.findOne({ selector: { _id: id } }).remove())

export const useUpdateDataSource = () =>
  useRxMutation(
    (db, { _id, ...rest }: Partial<DataSourceDocType> & Required<Pick<DataSourceDocType, '_id'>>) =>
      db.datasource.safeUpdate({ $set: rest }, dataSource => dataSource.findOne({ selector: { _id } }))
  )

export const useDataSourceHelpers = (id: typeof plugins[number]['uniqueResourceIdentifier']) => {
  return useMemo(() => ({
    generateResourceId: (resourceId: string) => `${id}-${resourceId}`
  }), [id])
}

export const useDataSourcePlugins = () => plugins

export const useGetDataSourceCredentials = () => {
  const plugins = useDataSourcePlugins()
  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type GetCredentials = ReturnType<typeof plugins[number]['useGetCredentials']>
  const getPluginCredentials = useRef<(Pick<typeof plugins[number], 'type'> & { getCredentials: GetCredentials })[]>([])
  getPluginCredentials.current = plugins.map(plugin => ({ type: plugin.type, getCredentials: plugin.useGetCredentials() }))

  return useCallback(async (linkType: DataSourceType) => {
    const found = getPluginCredentials.current.find(plugin => plugin.type === linkType)
    if (found) return found.getCredentials()

    return undefined
  }, [getPluginCredentials])
}