import { CollectionDocType } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"

export const useUpdateCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({
      _id,
      name,
      ...rest
    }: Partial<CollectionDocType> & { _id: string; name?: string }) => {
      const item = await db?.obokucollection
        .findOne({ selector: { _id } })
        .exec()

      return item?.incrementalModify((old) => ({
        ...old,
        ...rest,
        metadata: old.metadata?.map((entry) =>
          entry.type === "user"
            ? { ...entry, title: name ?? entry.title }
            : entry
        )
      }))
    }
  })
}
