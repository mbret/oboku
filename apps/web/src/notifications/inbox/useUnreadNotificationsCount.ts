import { useQuery } from "@tanstack/react-query"
import type { GetUnreadNotificationsCountResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { unreadCountQueryKey } from "./keys"

export const useUnreadNotificationsCount = () => {
  const query = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: async (): Promise<GetUnreadNotificationsCountResponse> => {
      const { data } =
        await httpClientApi.fetch<GetUnreadNotificationsCountResponse>(
          `${configuration.API_URL}/notifications/unread-count`,
        )

      return data
    },
    networkMode: "online",
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  return {
    ...query,
    unreadCount: query.data?.count ?? 0,
  }
}
