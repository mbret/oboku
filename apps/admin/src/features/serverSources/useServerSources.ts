import { useQuery } from "@tanstack/react-query"
import type { AdminListServerSourcesResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"

export const serverSourcesQueryKey = ["admin", "server-sources"] as const

export const useServerSources = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: serverSourcesQueryKey,
    enabled,
    queryFn: async (): Promise<AdminListServerSourcesResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync/sources`,
      )

      if (!response.ok) {
        throw new Error(response.statusText || "Could not load server sources")
      }

      return response.json()
    },
  })
}
