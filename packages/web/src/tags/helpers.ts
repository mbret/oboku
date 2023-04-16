import { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"

export const useCreateTag = () => {
  const { db } = useDatabase()

  return useMutation(async ({ name }: { name: string }) =>
    db?.tag.insertSafe({
      name,
      books: [],
      isProtected: false,
      createdAt: new Date().toISOString(),
      modifiedAt: null
    })
  )
}

export const useUpdateTag = () => {
  const { db } = useDatabase()

  return useCallback(
    ({
      _id,
      ...rest
    }: Partial<TagsDocType> & Required<Pick<TagsDocType, "_id">>) =>
      db?.tag
        .findOne({ selector: { _id } })
        .exec()
        .then((doc) =>
          doc?.atomicUpdate((doc) => ({
            ...doc,
            ...rest
          }))
        ),
    [db]
  )
}
