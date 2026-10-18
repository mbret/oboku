import { useQuery } from "@tanstack/react-query"
import { notificationsUnreadCount } from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { useLocalNotifications } from "./useLocalNotifications"
import { unreadCountQueryKey } from "./queryKeys"

export const useUnreadNotificationsCount = () => {
  const httpClientApi = useHttpClientApi()
  const localNotifications = useLocalNotifications()
  const activeProfileId = useActiveProfileId()

  const query = useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: unreadCountQueryKey(activeProfileId),
      queryFn: async function fetchUnreadNotificationsCount() {
        const { data } = await notificationsUnreadCount({
          client: httpClientApi.sdkClient,
        })

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
