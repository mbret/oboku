import { useQuery } from "@tanstack/react-query"
import { notificationsList } from "@oboku/shared"
import { useHttpClientApi } from "../../http"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { inboxNotificationsQueryKey } from "./queryKeys"

export const useInboxNotifications = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: inboxNotificationsQueryKey(activeProfileId),
      queryFn: async function fetchInboxNotifications() {
        const { data } = await notificationsList({
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
}
