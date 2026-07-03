import { useQuery } from "@tanstack/react-query"
import type { GetNotificationsResponse } from "@oboku/shared"
import { useConfig } from "../../config/useConfig"
import { useHttpClientApi } from "../../http"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { inboxNotificationsQueryKey } from "./queryKeys"

export const useInboxNotifications = () => {
  const httpClientApi = useHttpClientApi()
  const { data: config } = useConfig()
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: inboxNotificationsQueryKey,
    queryFn: async (): Promise<GetNotificationsResponse> => {
      const { data } =
        await httpClientApi.fetchOrThrow<GetNotificationsResponse>(
          `${config?.API_URL}/notifications`,
        )

      return data
    },
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
    gcTime: Infinity,
    refetchInterval: 30 * 1000,
    meta: { persist: true },
  })
}
