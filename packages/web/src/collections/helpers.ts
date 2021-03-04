import { CollectionDocType } from '@oboku/shared'
import { useRxMutation } from "../rxdb/hooks"

export const useCreateCollection = () =>
  useRxMutation((db, { name }: { name: string }) => db?.obokucollection.post({
    name,
    books: [],
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    dataSourceId: null,
  }))

export const useRemoveCollection = () =>
  useRxMutation((db, { _id }: { _id: string }) => db.obokucollection.findOne({ selector: { _id } }).remove())

export const useUpdateCollection = () =>
  useRxMutation(
    (db, { _id, ...rest }: Partial<CollectionDocType> & { _id: string }) =>
      db.obokucollection.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )