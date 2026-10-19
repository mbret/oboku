import { useMutation } from "@tanstack/react-query"
import { adminMigrateWebdavResourceIds } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useMigrateWebdavResourceIds = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminMigrateWebdavResourceIds({
        client: apiClient,
      })

      return data
    },
  })
}
