import { useRxMutation } from "../rxdb/hooks";
import { LinkDocType, DataSourceType } from 'oboku-shared'
import { useRefreshBookMetadata } from "../books/helpers";
import { useDatabase } from "../rxdb";

type EditBookPayload = Partial<LinkDocType> & Required<Pick<LinkDocType, '_id'>>

export const useEditLink = () => {
  const db = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()
  const [editLink] = useRxMutation(
    (db, { _id, ...rest }: EditBookPayload) =>
      db.link.safeUpdate({ $set: rest }, collection => collection.findOne({ selector: { _id } }))
  )

  return async (data: EditBookPayload) => {
    await editLink(data)
    const completeLink = await db?.link.findOne({ selector: { _id: data._id } }).exec()

    if (completeLink?.book && completeLink.type === DataSourceType.URI && data.resourceId) {
      refreshBookMetadata(completeLink.book)
    }
  }
}