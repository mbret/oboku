import { useMutation } from "@tanstack/react-query"
import { adminMigrateWebdavConnectors } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useMigrateWebdavConnectors = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminMigrateWebdavConnectors({ client: apiClient })

      return data
    },
  })
}
