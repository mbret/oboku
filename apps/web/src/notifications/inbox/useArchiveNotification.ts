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
  archiveMutationKey,
  cancelAndSnapshotNotificationQueries,
  inboxNotificationsQueryKey,
  invalidateNotificationQueries,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"

export const archiveMutationOptions = (queryClient: QueryClient) => ({
  mutationKey: archiveMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.archiveNotification,
  onMutate: async ({ id }: { id: number }) => {
    const snapshot = await cancelAndSnapshotNotificationQueries(queryClient)

    const removed = snapshot.previousNotifications?.find((n) => n.id === id)

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey,
      (old) => old?.filter((n) => n.id !== id),
    )

    if (removed && !removed.seenAt) {
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

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()

  return useMutation(archiveMutationOptions(queryClient))
}
