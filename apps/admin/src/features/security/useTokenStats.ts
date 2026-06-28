import { useQuery } from "@tanstack/react-query"
import type { GetTokenStatsResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

export const tokenStatsQueryKey = ["admin", "tokens", "stats"] as const

export const useTokenStats = () => {
  return useQuery({
    queryKey: tokenStatsQueryKey,
    queryFn: async (): Promise<GetTokenStatsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/tokens/stats`,
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not load token stats",
          ),
        )
      }

      return response.json()
    },
  })
}
