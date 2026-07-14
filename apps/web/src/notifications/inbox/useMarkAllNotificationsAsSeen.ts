import type { QueryClient } from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import type { HttpApiClientWeb } from "../../http"
import {
  type NotificationCacheSnapshot,
  cancelAndSnapshotNotificationQueries,
  inboxNotificationsQueryKey,
  invalidateNotificationQueries,
  markAllSeenMutationKey,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"
import { useNotificationMutation } from "./useNotificationMutation"

export const markAllSeenMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) => ({
  mutationKey: markAllSeenMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.markAllNotificationsAsSeen,
  onMutate: async () => {
    const snapshot = await cancelAndSnapshotNotificationQueries(
      queryClient,
      profileId,
    )

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey(profileId),
      (old) =>
        old?.map((n) =>
          n.seenAt ? n : { ...n, seenAt: new Date().toISOString() },
        ),
    )

    queryClient.setQueryData<GetUnreadNotificationsCountResponse>(
      unreadCountQueryKey(profileId),
      (old) => (old ? { count: 0 } : old),
    )

    return snapshot
  },
  onError: (
    _err: unknown,
    _vars: undefined,
    context: NotificationCacheSnapshot | undefined,
  ) => rollbackNotificationCaches(queryClient, profileId, context),
  onSettled: () => invalidateNotificationQueries(queryClient, profileId),
})

export const useMarkAllNotificationsAsSeen = () =>
  useNotificationMutation(markAllSeenMutationOptions)
