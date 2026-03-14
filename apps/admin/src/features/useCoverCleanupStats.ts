import { useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type CoverCleanupStats = {
  storageStrategy: "fs" | "s3"
  storageLocation: string
  storedCovers: number | null
  storedSizeInBytes: number | null
  canDeleteAllCovers: boolean
}

export const coverCleanupStatsQueryKey = ["admin", "covers", "cleanup"] as const

export const useCoverCleanupStats = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: coverCleanupStatsQueryKey,
    enabled,
    queryFn: async (): Promise<CoverCleanupStats> => {
      const response = await authenticatedFetch(`${config.apiUrl}/admin/covers`)

      if (!response.ok) {
        throw new Error(response.statusText || "Could not load cover stats")
      }

      return response.json()
    },
  })
}
