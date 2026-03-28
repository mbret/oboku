import { useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"

export type ServerSource = {
  id: string
  name: string
  path: string
  enabled: boolean
}

export const serverSourcesQueryKey = ["admin", "server-sources"] as const

export const useServerSources = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: serverSourcesQueryKey,
    enabled,
    queryFn: async (): Promise<ServerSource[]> => {
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
