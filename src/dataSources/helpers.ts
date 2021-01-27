import { first } from "rxjs/operators"
import { useAxiosClient } from "../axiosClient"
import { useDatabase } from "../rxdb"
import { DataSourceDocType, DataSourceType } from 'oboku-shared'
import { useRxMutation } from "../rxdb/hooks"
import { Report } from "../report"
import { useRecoilCallback } from "recoil"
import { plugins } from "./configure"
import { useCallback, useMemo, useRef } from "react"
import { UseDownloadHook } from "./types"

export const useSynchronizeDataSource = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateDataSource] = useUpdateDataSource()
  const getDataSourceCredentials = useGetDataSourceCredentials()

  return useRecoilCallback(({ snapshot }) => async (_id: string) => {
    try {
      const dataSource = await database?.datasource.findOne({ selector: { _id } }).exec()

      if (!dataSource) return

      const credentials = await getDataSourceCredentials(dataSource.type)

      if ('isError' in credentials && credentials.reason === 'cancelled') return
      if ('isError' in credentials) throw credentials.error || new Error('')

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
          completed && client.syncDataSource(_id, credentials.data).catch(Report.error)
        })
    } catch (e) {
      Report.error(e)
    }
  })
}

export const useCreateDataSource = () => {
  type Payload = Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>
  const synchronize = useSynchronizeDataSource()
  const [createDataSource] = useRxMutation((db, variables: Payload) => db?.datasource.post({ ...variables }))

  return async (data: Omit<Payload, 'lastSyncedAt' | 'createdAt' | 'modifiedAt'>) => {
    const dataSource = await createDataSource({ ...data, lastSyncedAt: null, createdAt: new Date().toISOString(), modifiedAt: null })
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

    throw new Error('no datasource found for this link')
  }, [getPluginCredentials])
}

export const useDownloadBookFromDataSource = () => {
  const plugins = useDataSourcePlugins()
  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseDownloadBook = ReturnType<typeof plugins[number]['useDownloadBook']>
  const getPluginFn = useRef<(Pick<typeof plugins[number], 'type'> & { useDownloadBook: UseDownloadBook })[]>([])
  getPluginFn.current = plugins.map(plugin => ({ type: plugin.type, useDownloadBook: plugin.useDownloadBook() }))

  const downloadBook: ReturnType<UseDownloadHook> = async (link, options) => {
    const found = getPluginFn.current.find(plugin => plugin.type === link.type)
    if (found) return found.useDownloadBook(link, options)

    throw new Error('no datasource found for this link')
  }

  return useCallback(downloadBook, [getPluginFn])
}