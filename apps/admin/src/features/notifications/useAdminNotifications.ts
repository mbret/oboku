import { useQuery } from "@tanstack/react-query"
import { adminListNotifications } from "@oboku/shared"
import { apiClient } from "../apiClient"

export const adminNotificationsQueryKey = ["admin", "notifications"] as const

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: adminNotificationsQueryKey,
    queryFn: async () => {
      const { data } = await adminListNotifications({ client: apiClient })

      return data
    },
  })
}
