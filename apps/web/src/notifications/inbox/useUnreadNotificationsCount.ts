import { useQuery } from "@tanstack/react-query"
import type { GetUnreadNotificationsCountResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { useLocalNotifications } from "./useLocalNotifications"
import { unreadCountQueryKey } from "./queryKeys"

export const useUnreadNotificationsCount = () => {
  const localNotifications = useLocalNotifications()
  const isAuthenticated = useIsAuthenticated()

  const query = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: async (): Promise<GetUnreadNotificationsCountResponse> => {
      const { data } =
        await httpClientApi.fetchOrThrow<GetUnreadNotificationsCountResponse>(
          `${configuration.API_URL}/notifications/unread-count`,
        )

      return data
    },
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
    gcTime: Infinity,
    refetchInterval: 30 * 1000,
  })

  return {
    ...query,
    unreadCount: (query.data?.count ?? 0) + localNotifications.length,
  }
}
