import { CollectionDocType } from "../rxdb/collection"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateCollection = () =>
  useRxMutation<Omit<CollectionDocType, '_id'>>((db, { variables: { name } }) => db?.c_ollection.post({ name, books: [] }))

export const useRemoveCollection = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.c_ollection.findOne({ selector: { _id: id } }).remove())

export const useUpdateCollection = () =>
  useRxMutation<Partial<CollectionDocType> & Required<Pick<CollectionDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.c_ollection.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )