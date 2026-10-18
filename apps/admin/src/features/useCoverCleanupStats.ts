import { useQuery } from "@tanstack/react-query"
import type { AdminGetCoversCleanupStatsResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const coverCleanupStatsQueryKey = ["admin", "covers", "cleanup"] as const

export const useCoverCleanupStats = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: coverCleanupStatsQueryKey,
    enabled,
    queryFn: async (): Promise<AdminGetCoversCleanupStatsResponse> => {
      const response = await authenticatedFetch(`${config.apiUrl}/admin/covers`)

      if (!response.ok) {
        throw new Error(response.statusText || "Could not load cover stats")
      }

      return response.json()
    },
  })
}
