import { first } from "rxjs/operators"
import { useAxiosClient } from "../axiosClient"
import { useDatabase } from "../rxdb"
import { DataSourceDocType } from 'oboku-shared'
import { useRxMutation } from "../rxdb/hooks"
import { Report } from "../report"

export const useSynchronizeDataSource = () => {
  const client = useAxiosClient()
  const database = useDatabase()
  const [updateDataSource] = useUpdateDataSource()

  return async (_id: string) => {
    await updateDataSource({ lastSyncedAt: null, _id })
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
        completed && client.syncDataSource(_id).catch(Report.error)
      })
  }
}

export const useCreateDataSource = () => {
  type Payload = Omit<DataSourceDocType, '_id' | 'rx_model' | '_rev'>
  const synchronize = useSynchronizeDataSource()
  const [createDataSource] = useRxMutation((db, variables: Payload) => db?.datasource.post({ ...variables }))

  return async (data: Payload) => {
    const dataSource = await createDataSource(data)
    await synchronize(dataSource._id)
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


