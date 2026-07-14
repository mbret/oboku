import { useQuery } from "@tanstack/react-query"
import type { GetNotificationsResponse } from "@oboku/shared"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useQueryOptionsWithAuthentication } from "../../auth"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { inboxNotificationsQueryKey } from "./queryKeys"

export const useInboxNotifications = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication({
      queryKey: inboxNotificationsQueryKey(activeProfileId),
      queryFn: async (): Promise<GetNotificationsResponse> => {
        const { data } =
          await httpClientApi.fetchOrThrow<GetNotificationsResponse>(
            `${config?.API_URL}/notifications`,
          )

        return data
      },
      staleTime: 15 * 1000,
      gcTime: Infinity,
      refetchInterval: 30 * 1000,
      meta: { persist: true },
    }),
  )
}
