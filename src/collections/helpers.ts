import { CollectionDocType } from "../rxdb/collection"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateCollection = () =>
  useRxMutation<{ name: string }>((db, { variables: { name } }) => db?.collection.post({ name, books: [] }))

export const useRemoveCollection = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.collection.findOne({ selector: { _id: id } }).remove())

export const useUpdateCollection = () =>
  useRxMutation<Partial<CollectionDocType> & Required<Pick<CollectionDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.collection.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )