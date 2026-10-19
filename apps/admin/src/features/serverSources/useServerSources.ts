import { useQuery } from "@tanstack/react-query"
import { adminListServerSources } from "@oboku/shared"
import { apiClient } from "../apiClient"

export const serverSourcesQueryKey = ["admin", "server-sources"] as const

export const useServerSources = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: serverSourcesQueryKey,
    enabled,
    queryFn: async () => {
      const { data } = await adminListServerSources({ client: apiClient })

      return data
    },
  })
}
