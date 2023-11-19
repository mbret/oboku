import { CollectionDocType } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useAsyncQuery } from "reactjrx"

export const useCreateCollection = () => {
  const { db } = useDatabase()

  return useAsyncQuery(
    async ({ name }: { name: string }) =>
      db?.obokucollection.post({
        name,
        books: [],
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        dataSourceId: null
      })
  )
}

export const useRemoveCollection = () => {
  const { db } = useDatabase()

  return useAsyncQuery(
    async ({ _id }: { _id: string }) =>
      db?.obokucollection.findOne({ selector: { _id } }).remove()
  )
}

export const useUpdateCollection = () => {
  const { db } = useDatabase()

  return useAsyncQuery(
    async ({ _id, ...rest }: Partial<CollectionDocType> & { _id: string }) =>
      db?.obokucollection.safeUpdate({ $set: rest }, (collection) =>
        collection.findOne({ selector: { _id } })
      )
  )
}
