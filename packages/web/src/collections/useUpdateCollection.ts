import { CollectionDocType } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"

export const useUpdateCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      ...rest
    }: Partial<CollectionDocType> & { _id: string }) =>
      db?.obokucollection.safeUpdate({ $set: rest }, (collection) =>
        collection.findOne({ selector: { _id } })
      )
  })
}
