import { useQuery } from "@tanstack/react-query"
import { adminGetSettings } from "@oboku/shared"
import { apiClient } from "./apiClient"

export const instanceSettingsQueryKey = ["admin", "settings"] as const

export const useInstanceSettings = () => {
  return useQuery({
    queryKey: instanceSettingsQueryKey,
    queryFn: async () => {
      const { data } = await adminGetSettings({ client: apiClient })

      return data
    },
  })
}
