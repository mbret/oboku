import { useQuery } from "@tanstack/react-query"
import { useSignalValue } from "reactjrx"
import type { GetUnreadNotificationsCountResponse } from "@oboku/shared"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { activeProfileIdSignal } from "../../profiles/active/activeProfileId"
import { useLocalNotifications } from "./useLocalNotifications"
import { unreadCountQueryKey } from "./queryKeys"

export const useUnreadNotificationsCount = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const localNotifications = useLocalNotifications()
  const activeProfileId = useSignalValue(activeProfileIdSignal)

  const query = useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: unreadCountQueryKey(activeProfileId),
      queryFn: async (): Promise<GetUnreadNotificationsCountResponse> => {
        const { data } =
          await httpClientApi.fetchOrThrow<GetUnreadNotificationsCountResponse>(
            `${config?.API_URL}/notifications/unread-count`,
          )

        return data
      },
      staleTime: 15 * 1000,
      gcTime: Infinity,
      refetchInterval: 30 * 1000,
      meta: { persist: true },
    }),
  )

  const serverUnreadCount = query.data?.count ?? 0

  return {
    ...query,
    serverUnreadCount,
    unreadCount: serverUnreadCount + localNotifications.length,
  }
}
