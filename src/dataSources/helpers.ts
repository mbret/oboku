import { DataSourceDocType } from "../rxdb/dataSource"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateDataSource = () =>
  useRxMutation<{ name: string }>((db, { variables: { name } }) => db?.dataSource.post({ name, books: [] }))

export const useRemoveDataSource = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.dataSource.findOne({ selector: { _id: id } }).remove())

export const useUpdateDataSource = () =>
  useRxMutation<Partial<DataSourceDocType> & Required<Pick<DataSourceDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.dataSource.safeUpdate({ $set: rest }, dataSource => dataSource.findOne({ selector: { _id } }))
  )