import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { GetNotificationsResponse } from "@oboku/shared"
import { configuration } from "../../config/configuration"
import { httpClientApi } from "../../http/httpClientApi.web"

export const inboxNotificationsQueryKey = ["api", "notifications"] as const

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

export const useUnreadNotificationsCount = () => {
  const query = useInboxNotifications()

  return {
    ...query,
    unreadCount: (query.data ?? []).filter(
      (notification) => !notification.seenAt,
    ).length,
  }
}

export const useMarkNotificationAsSeen = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await httpClientApi.fetch(
        `${configuration.API_URL}/notifications/${id}/seen`,
        {
          method: "POST",
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inboxNotificationsQueryKey,
      })
    },
  })
}

export const useMarkAllNotificationsAsSeen = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await httpClientApi.fetch(`${configuration.API_URL}/notifications/seen`, {
        method: "POST",
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inboxNotificationsQueryKey,
      })
    },
  })
}

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await httpClientApi.fetch(
        `${configuration.API_URL}/notifications/${id}/archive`,
        {
          method: "POST",
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inboxNotificationsQueryKey,
      })
    },
  })
}
