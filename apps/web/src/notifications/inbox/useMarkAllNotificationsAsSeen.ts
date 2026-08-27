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
  markAllSeenMutationKey,
  unreadCountQueryKey,
} from "./queryKeys"

export const markAllSeenMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) =>
  createNotificationMutationOptions({
    queryClient,
    profileId,
    mutationKey: markAllSeenMutationKey,
    mutationFn: httpClientApi.markAllNotificationsAsSeen,
    applyOptimisticUpdate: (_vars: undefined) => {
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
    },
  })

export const useMarkAllNotificationsAsSeen = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation(
    markAllSeenMutationOptions(queryClient, httpClientApi, activeProfileId),
  )
}
