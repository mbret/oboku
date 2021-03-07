import { useAxiosClient } from "../axiosClient"
import { useDatabase } from "../rxdb"
import { DataSourceDocType, DataSourceType, Errors } from '@oboku/shared'
import { useRxMutation } from "../rxdb/hooks"
import { Report } from "../report"
import { useRecoilCallback } from "recoil"
import { plugins } from "./configure"
import { useCallback, useMemo, useRef } from "react"
import { UseDownloadHook } from "./types"
import { useDialogManager } from "../dialog"
import { useNetworkState } from "react-use"
import { useSync } from "../rxdb/useSync"
import { AtomicUpdateFunction } from "rxdb"

export const useSynchronizeDataSource = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateDataSource] = useAtomicUpdateDataSource()
  const getDataSourceCredentials = useGetDataSourceCredentials()
  const network = useNetworkState()
  const dialog = useDialogManager()
  const sync = useSync()

  return useRecoilCallback(({ snapshot }) => async (_id: string) => {
    if (!network.online) {
      return dialog({ preset: 'OFFLINE' })
    }

    try {
      const dataSource = await database?.datasource.findOne({ selector: { _id } }).exec()

      if (!dataSource) return

      const credentials = await getDataSourceCredentials(dataSource.type)

      if ('isError' in credentials && credentials.reason === 'cancelled') return
      if ('isError' in credentials) throw credentials.error || new Error('')

      await updateDataSource(_id, old => ({ ...old, syncStatus: 'fetching' }))

      try {
        await sync(['datasource'])
        await client.syncDataSource(_id, credentials.data)
      } catch (e) {
        await updateDataSource(_id, old => ({ ...old, syncStatus: null, lastSyncErrorCode: Errors.ERROR_DATASOURCE_NETWORK_UNREACHABLE }))
        throw e
      }
    } catch (e) {
      Report.error(e)
    }
  })
}

export const useCreateDataSource = () => {
  type Payload = Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>
  const synchronize = useSynchronizeDataSource()
  const [createDataSource] = useRxMutation((db, variables: Payload) => db?.datasource.post({ ...variables }))
  const network = useNetworkState()

  return async (data: Omit<Payload, 'lastSyncedAt' | 'createdAt' | 'modifiedAt' | 'syncStatus'>) => {
    const dataSource = await createDataSource({
      ...data,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncStatus: null,
    })
    if (network.online) {
      await synchronize(dataSource._id)
    }
  }
}

export const useRemoveDataSource = () =>
  useRxMutation((db, { id }: { id: string }) => db.datasource.findOne({ selector: { _id: id } }).remove())

export const useAtomicUpdateDataSource = () => {
  const database = useDatabase()

  const updater = useCallback(async (id: string, mutationFunction: AtomicUpdateFunction<DataSourceDocType>) => {
    const item = await database?.datasource.findOne({ selector: { _id: id } }).exec()
    return await item?.atomicUpdate(mutationFunction)
  }, [database])

  return [updater]
}

export const useDataSourceHelpers = (id: typeof plugins[number]['uniqueResourceIdentifier']) => {
  return useMemo(() => ({
    generateResourceId: (resourceId: string) => `${id}-${resourceId}`,
    extractIdFromResourceId: (resourceId: string) => resourceId.replace(`${id}-`, ``)
  }), [id])
}

export const useDataSourcePlugins = () => plugins

export const useGetDataSourceCredentials = () => {
  const plugins = useDataSourcePlugins()
  const dialog = useDialogManager()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type GetCredentials = ReturnType<typeof plugins[number]['useGetCredentials']>
  const getPluginCredentials = useRef<(Pick<typeof plugins[number], 'type'> & { getCredentials: GetCredentials })[]>([])
  getPluginCredentials.current = plugins.map(plugin => ({ type: plugin.type, getCredentials: plugin.useGetCredentials() }))

  return useCallback(async (linkType: DataSourceType) => {
    const found = getPluginCredentials.current.find(plugin => plugin.type === linkType)
    if (found) {
      const res = await found.getCredentials()

      if ('isError' in res && res.reason === 'popupBlocked') {
        dialog({
          title: 'Unable to authenticate',
          content: `
          It seems that your browser is blocking popup so we cannot authenticate you with the provider. 
          Please add a restriction for oboku or try with another browser. Safari blocks all popups by default for example.
          `
        })
      }

      return res
    }

    throw new Error('no datasource found for this link')
  }, [getPluginCredentials, dialog])
}

export const useDownloadBookFromDataSource = () => {
  const plugins = useDataSourcePlugins()
  const dialog = useDialogManager()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseDownloadBook = ReturnType<typeof plugins[number]['useDownloadBook']>
  const getPluginFn = useRef<(Pick<typeof plugins[number], 'type'> & { useDownloadBook: UseDownloadBook })[]>([])
  getPluginFn.current = plugins.map(plugin => ({ type: plugin.type, useDownloadBook: plugin.useDownloadBook() }))

  const downloadBook: ReturnType<UseDownloadHook> = async (link, options) => {
    const found = getPluginFn.current.find(plugin => plugin.type === link.type)
    if (found) {
      const res = await found.useDownloadBook(link, options)

      if ('isError' in res && res.reason === 'popupBlocked') {
        dialog({
          title: 'Unable to authenticate',
          content: `
          It seems that your browser is blocking popup so we cannot authenticate you with the provider. 
          Please add a restriction for oboku or try with another browser. Safari blocks all popups by default for example.
          `
        })
      }

      return res
    }

    throw new Error('no datasource found for this link')
  }

  return useCallback(downloadBook, [getPluginFn, dialog])
}

export const useDataSourcePlugin = (type?: DataSourceType) => plugins.find(plugin => plugin.type === type)

export const useRemoveBookFromDataSource = () => {
  const plugins = useDataSourcePlugins()
  const db = useDatabase()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  const preparedHooks = plugins.map(plugin => ({
    type: plugin.type,
    useRemoveBook: plugin.useRemoveBook && plugin.useRemoveBook()
  }))

  const getPluginFn = useRef<typeof preparedHooks>([])

  getPluginFn.current = preparedHooks

  return useCallback(async (bookId: string) => {
    const book = await db?.book.findOne({ selector: { _id: bookId } }).exec()
    const link = await db?.link.findOne({ selector: { _id: book?.links[0] || null } }).exec()

    if (!link) {
      throw new Error('Link not found')
    }

    const found = getPluginFn.current.find(plugin => plugin.type === link.type)

    if (!found || !found.useRemoveBook) {
      throw new Error('no datasource found for this link or useRemoveBook is undefined')
    }

    const res = await found.useRemoveBook(link)

    return res
  }, [getPluginFn, db])
}