import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import { httpClientApi } from "../../http/httpClientApi.web"
import {
  type NotificationCacheSnapshot,
  cancelAndSnapshotNotificationQueries,
  inboxNotificationsQueryKey,
  invalidateNotificationQueries,
  markAllSeenMutationKey,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"

export const markAllSeenMutationOptions = (queryClient: QueryClient) => ({
  mutationKey: markAllSeenMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.markAllNotificationsAsSeen,
  onMutate: async () => {
    const snapshot = await cancelAndSnapshotNotificationQueries(queryClient)

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey,
      (old) =>
        old?.map((n) =>
          n.seenAt ? n : { ...n, seenAt: new Date().toISOString() },
        ),
    )

    queryClient.setQueryData<GetUnreadNotificationsCountResponse>(
      unreadCountQueryKey,
      (old) => (old ? { count: 0 } : old),
    )

    return snapshot
  },
  onError: (
    _err: unknown,
    _vars: undefined,
    context: NotificationCacheSnapshot | undefined,
  ) => rollbackNotificationCaches(queryClient, context),
  onSettled: () => invalidateNotificationQueries(queryClient),
})

export const useMarkAllNotificationsAsSeen = () => {
  const queryClient = useQueryClient()

  return useMutation(markAllSeenMutationOptions(queryClient))
}
