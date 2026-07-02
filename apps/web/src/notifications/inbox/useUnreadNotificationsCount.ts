import { useQuery } from "@tanstack/react-query"
import type { GetUnreadNotificationsCountResponse } from "@oboku/shared"
import { useConfig } from "../../config/useConfig"
import { httpClientApi } from "../../http/httpClientApi.web"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { useLocalNotifications } from "./useLocalNotifications"
import { unreadCountQueryKey } from "./queryKeys"

export const useUnreadNotificationsCount = () => {
  const { data: config } = useConfig()
  const localNotifications = useLocalNotifications()
  const isAuthenticated = useIsAuthenticated()

  const query = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: async (): Promise<GetUnreadNotificationsCountResponse> => {
      const { data } =
        await httpClientApi.fetchOrThrow<GetUnreadNotificationsCountResponse>(
          `${config?.API_URL}/notifications/unread-count`,
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
