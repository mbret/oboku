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
  markSeenMutationKey,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"

export const markSeenMutationOptions = (queryClient: QueryClient) => ({
  mutationKey: markSeenMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.markNotificationAsSeen,
  onMutate: async ({ id }: { id: number }) => {
    const snapshot = await cancelAndSnapshotNotificationQueries(queryClient)
    const target = snapshot.previousNotifications?.find((n) => n.id === id)

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey,
      (old) =>
        old?.map((n) =>
          n.id === id ? { ...n, seenAt: new Date().toISOString() } : n,
        ),
    )

    if (target && !target.seenAt) {
      queryClient.setQueryData<GetUnreadNotificationsCountResponse>(
        unreadCountQueryKey,
        (old) => (old ? { count: Math.max(0, old.count - 1) } : old),
      )
    }

    return snapshot
  },
  onError: (
    _err: unknown,
    _vars: { id: number },
    context: NotificationCacheSnapshot | undefined,
  ) => rollbackNotificationCaches(queryClient, context),
  onSettled: () => invalidateNotificationQueries(queryClient),
})

export const useMarkNotificationAsSeen = () => {
  const queryClient = useQueryClient()

  return useMutation(markSeenMutationOptions(queryClient))
}
