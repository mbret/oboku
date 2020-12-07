import { TagsDocType } from "../rxdb/databases"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateTag = () =>
  useRxMutation<{ name: string }>((db, { variables: { name } }) => db?.tag.post({ name, books: [], isProtected: false }))

export const useRemoveTag = () =>
  useRxMutation<{ id: string }>((db, { variables: { id } }) => db.tag.findOne({ selector: { _id: id } }).remove())

export const useUpdateTag = () =>
  useRxMutation<Partial<TagsDocType> & Required<Pick<TagsDocType, '_id'>>>(
    (db, { variables: { _id, ...rest } }) =>
      db.tag.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )