import { useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"
import type { GetInstanceSettingsResponse } from "@oboku/shared"

export const instanceSettingsQueryKey = ["admin", "settings"] as const

export const useInstanceSettings = () => {
  return useQuery({
    queryKey: instanceSettingsQueryKey,
    queryFn: async (): Promise<GetInstanceSettingsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/settings`,
      )

      if (!response.ok) {
        throw new Error(
          response.statusText || "Could not load instance settings",
        )
      }

      return response.json()
    },
  })
}
