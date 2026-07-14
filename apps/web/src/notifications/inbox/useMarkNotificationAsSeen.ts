import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { activeProfileIdSignal } from "../../profiles/active/activeProfileId"
import {
  type NotificationCacheSnapshot,
  cancelAndSnapshotNotificationQueries,
  inboxNotificationsQueryKey,
  invalidateNotificationQueries,
  markSeenMutationKey,
  rollbackNotificationCaches,
  unreadCountQueryKey,
} from "./queryKeys"

export const markSeenMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) => ({
  mutationKey: markSeenMutationKey,
  networkMode: "online" as const,
  mutationFn: httpClientApi.markNotificationAsSeen,
  onMutate: async ({ id }: { id: number }) => {
    const snapshot = await cancelAndSnapshotNotificationQueries(
      queryClient,
      profileId,
    )
    const target = snapshot.previousNotifications?.find((n) => n.id === id)

    queryClient.setQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey(profileId),
      (old) =>
        old?.map((n) =>
          n.id === id ? { ...n, seenAt: new Date().toISOString() } : n,
        ),
    )

    if (target && !target.seenAt) {
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

export const useMarkNotificationAsSeen = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useSignalValue(activeProfileIdSignal)

  return useMutation(
    markSeenMutationOptions(queryClient, httpClientApi, activeProfileId),
  )
}
