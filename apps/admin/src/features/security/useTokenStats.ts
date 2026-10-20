import { useQuery } from "@tanstack/react-query"
import { adminGetTokenStats } from "@oboku/shared"
import { apiClient } from "../apiClient"

export const tokenStatsQueryKey = ["admin", "tokens", "stats"] as const

export const useTokenStats = () => {
  return useQuery({
    queryKey: tokenStatsQueryKey,
    queryFn: async () => {
      const { data } = await adminGetTokenStats({ client: apiClient })

      return data
    },
  })
}
