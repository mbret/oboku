import { TagsDocType } from "@oboku/shared"
import { useRxMutation } from "../rxdb/hooks"

export const useCreateTag = () =>
  useRxMutation((db, { name }: { name: string }) => db?.tag.post({ name, books: [], isProtected: false, createdAt: new Date().toISOString(), modifiedAt: null }))

export const useRemoveTag = () =>
  useRxMutation((db, { id }: { id: string }) => db.tag.findOne({ selector: { _id: id } }).remove())

export const useUpdateTag = () =>
  useRxMutation(
    (db, { _id, ...rest }: Partial<TagsDocType> & Required<Pick<TagsDocType, '_id'>>) =>
      db.tag.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )