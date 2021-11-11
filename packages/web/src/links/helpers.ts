import { useRxMutation } from "../rxdb/hooks";
import { LinkDocType, DataSourceType } from '@oboku/shared'
import { useRefreshBookMetadata } from "../books/helpers";
import { useDatabase } from "../rxdb";
import { Report } from "../debug/report"

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

// export const useRemoveLink = () => {
//   const db = useDatabase()

//   return async (linkId: string) => {
//     const link = await db?.link.findOne({ selector: { _id: linkId } }).exec()
//     if (!link) {
//       return Report.warn(`trying to remove link ${linkId} but it does not exist`)
//     }
//     return await link.remove()
//   }
// }