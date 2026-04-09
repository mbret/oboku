import { useQuery } from "@tanstack/react-query"
import type { GetNotificationsResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { inboxNotificationsQueryKey } from "./queryKeys"

export const useInboxNotifications = () => {
  return useQuery({
    queryKey: inboxNotificationsQueryKey,
    queryFn: async (): Promise<GetNotificationsResponse> => {
      const { data } =
        await httpClientApi.fetchOrThrow<GetNotificationsResponse>(
          `${configuration.API_URL}/notifications`,
        )

      return data
    },
    staleTime: 15 * 1000,
    gcTime: Infinity,
    refetchInterval: 30 * 1000,
  })
}
