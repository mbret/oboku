import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"

export const useCreateCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) =>
      db?.obokucollection.post({
        books: [],
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        metadata: [{ type: "user", title: name }]
      })
  })
}
