import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { createNotificationMutationOptions } from "./createNotificationMutationOptions"
import {
  inboxNotificationsQueryKey,
  markSeenMutationKey,
  unreadCountQueryKey,
} from "./queryKeys"

export const markSeenMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) =>
  createNotificationMutationOptions({
    queryClient,
    profileId,
    mutationKey: markSeenMutationKey,
    mutationFn: httpClientApi.markNotificationAsSeen,
    applyOptimisticUpdate: ({ id }: { id: number }, snapshot) => {
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
    },
  })

export const useMarkNotificationAsSeen = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation(
    markSeenMutationOptions(queryClient, httpClientApi, activeProfileId),
  )
}
