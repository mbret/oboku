import { useMutation } from "@tanstack/react-query"
import type { AdminResetRefreshTokenCreatedAtResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useResetRefreshTokenCreatedAt = () => {
  return useMutation({
    mutationFn: async (): Promise<AdminResetRefreshTokenCreatedAtResponse> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/reset-refresh-token-created-at`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      if (!res.ok) {
        throw new Error(res.statusText || "Migration failed")
      }
      return res.json()
    },
  })
}
