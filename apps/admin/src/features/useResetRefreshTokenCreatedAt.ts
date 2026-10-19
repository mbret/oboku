import { useMutation } from "@tanstack/react-query"
import { adminResetRefreshTokenCreatedAt } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useResetRefreshTokenCreatedAt = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await adminResetRefreshTokenCreatedAt({
        client: apiClient,
      })

      return data
    },
  })
}
