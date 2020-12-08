import { DataSourceDocType } from "../rxdb/dataSource"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateDataSource = () =>
  useRxMutation<Omit<DataSourceDocType, '_id'>>((db, { variables }) => db?.datasource.post({ ...variables }))

export const useRemoveDataSource = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.datasource.findOne({ selector: { _id: id } }).remove())

export const useUpdateDataSource = () =>
  useRxMutation<Partial<DataSourceDocType> & Required<Pick<DataSourceDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.datasource.safeUpdate({ $set: rest }, dataSource => dataSource.findOne({ selector: { _id } }))
  )