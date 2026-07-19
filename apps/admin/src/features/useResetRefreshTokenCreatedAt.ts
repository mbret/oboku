import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type ResetRefreshTokenCreatedAtResult = {
  updated: number
}

export const useResetRefreshTokenCreatedAt = () => {
  return useMutation({
    mutationFn: async (): Promise<ResetRefreshTokenCreatedAtResult> => {
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
