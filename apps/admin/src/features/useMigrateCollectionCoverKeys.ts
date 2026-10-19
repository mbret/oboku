import { useMutation } from "@tanstack/react-query"
import { adminMigrateCollectionCoverKeys } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useMigrateCollectionCoverKeys = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminMigrateCollectionCoverKeys({
        client: apiClient,
      })

      return data
    },
  })
}
