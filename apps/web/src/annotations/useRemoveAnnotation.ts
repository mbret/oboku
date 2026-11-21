import { useMutation } from "@tanstack/react-query"
import { useDatabase } from "../rxdb"

export const useRemoveAnnotation = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async function removeAnnotation(id: string) {
      return db?.annotation.findOne(id).incrementalRemove()
    },
  })
}
