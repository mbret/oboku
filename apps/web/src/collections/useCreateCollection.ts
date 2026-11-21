import { useMutation } from "@tanstack/react-query"
import { ensureDatabase, useDatabase } from "../rxdb"

export const useCreateCollection = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) =>
      ensureDatabase(db).obokucollection.post({
        books: [],
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        metadata: [{ type: "user", title: name }],
      }),
  })
}
