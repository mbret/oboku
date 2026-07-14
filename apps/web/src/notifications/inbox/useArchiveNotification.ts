import type { QueryClient } from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import type { HttpApiClientWeb } from "../../http"
import {
  type NotificationCacheSnapshot,
  archiveMutationKey,
  cancelAndSnapshotNotificationQueries,
  inboxNotificationsQueryKey,
  invalidateNotificationQueries,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"
import { useNotificationMutation } from "./useNotificationMutation"

export const archiveMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) => ({
  mutationKey: archiveMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.archiveNotification,
  onMutate: async ({ id }: { id: number }) => {
    const snapshot = await cancelAndSnapshotNotificationQueries(
      queryClient,
      profileId,
    )

    const removed = snapshot.previousNotifications?.find((n) => n.id === id)

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey(profileId),
      (old) => old?.filter((n) => n.id !== id),
    )

    if (removed && !removed.seenAt) {
      queryClient.setQueryData<GetUnreadNotificationsCountResponse>(
        unreadCountQueryKey(profileId),
        (old) => (old ? { count: Math.max(0, old.count - 1) } : old),
      )
    }

    return snapshot
  },
  onError: (
    _err: unknown,
    _vars: { id: number },
    context: NotificationCacheSnapshot | undefined,
  ) => rollbackNotificationCaches(queryClient, profileId, context),
  onSettled: () => invalidateNotificationQueries(queryClient, profileId),
})

export const useArchiveNotification = () =>
  useNotificationMutation(archiveMutationOptions)
