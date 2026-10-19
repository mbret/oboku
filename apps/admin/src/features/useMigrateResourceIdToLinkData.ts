import { useMutation } from "@tanstack/react-query"
import { adminMigrateResourceIdToLinkData } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useMigrateResourceIdToLinkData = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminMigrateResourceIdToLinkData({
        client: apiClient,
      })

      return data
    },
  })
}
