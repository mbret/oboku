import { useMutation } from "@tanstack/react-query"
import { ensureDatabase, useDatabase } from "../rxdb"

export const useRemoveAnnotation = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async function removeAnnotation(id: string) {
      return ensureDatabase(db).annotation.findOne(id).incrementalRemove()
    },
  })
}
