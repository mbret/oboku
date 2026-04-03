import { useQuery } from "@tanstack/react-query"
import type { GetNotificationsResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { inboxNotificationsQueryKey } from "./keys"

export const useInboxNotifications = () => {
  return useQuery({
    queryKey: inboxNotificationsQueryKey,
    queryFn: async (): Promise<GetNotificationsResponse> => {
      const { data } = await httpClientApi.fetch<GetNotificationsResponse>(
        `${configuration.API_URL}/notifications`,
      )

      return data
    },
    networkMode: "online",
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}
