import { useQuery } from "@tanstack/react-query"
import type { GetUnreadNotificationsCountResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"
import { unreadCountQueryKey } from "./queryKeys"

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
    staleTime: 15 * 1000,
    gcTime: Infinity,
    refetchInterval: 30 * 1000,
  })

  return {
    ...query,
    unreadCount: query.data?.count ?? 0,
  }
}
