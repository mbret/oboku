import { useMutation } from "@tanstack/react-query"
import { useDatabase } from "../../rxdb"

export const useSetCatalogEnabled = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      db?.settings.setCatalogEnabled(id, isEnabled),
  })
}
