import { useMutation } from "@tanstack/react-query"
import { useDatabase } from "../rxdb"

export const useRemoveCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id }: { _id: string }) => {
      const document = await db?.obokucollection.findOne(_id).exec()

      if (!document) throw new Error("no item")

      return document.remove()
    },
    onError: console.error
  })
}
