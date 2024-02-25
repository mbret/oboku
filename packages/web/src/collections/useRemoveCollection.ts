import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"

export const useRemoveCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ _id }: { _id: string }) =>
      db?.obokucollection.findOne({ selector: { _id } }).remove()
  })
}