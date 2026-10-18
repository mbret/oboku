import { useQuery } from "@tanstack/react-query"
import type { AdminListNotificationsResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

export const adminNotificationsQueryKey = ["admin", "notifications"] as const

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: adminNotificationsQueryKey,
    queryFn: async (): Promise<AdminListNotificationsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/notifications`,
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not load notifications",
          ),
        )
      }

      return response.json()
    },
  })
}
