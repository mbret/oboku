import { useQuery } from "@tanstack/react-query"
import { adminGetCoversCleanupStats } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const coverCleanupStatsQueryKey = ["admin", "covers", "cleanup"] as const

export const useCoverCleanupStats = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: coverCleanupStatsQueryKey,
    enabled,
    queryFn: async () => {
      const { data } = await adminGetCoversCleanupStats({ client: apiClient })

      return data
    },
  })
}
