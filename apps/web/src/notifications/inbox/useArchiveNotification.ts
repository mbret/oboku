import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import {
  type NotificationsArchiveData,
  type NotificationsListResponse,
  type NotificationsUnreadCountResponse,
  notificationsArchive,
} from "@oboku/shared"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { createNotificationMutationOptions } from "./createNotificationMutationOptions"
import {
  archiveMutationKey,
  inboxNotificationsQueryKey,
  unreadCountQueryKey,
} from "./queryKeys"

export const archiveMutationOptions = (
  queryClient: QueryClient,
  httpClientApi: HttpApiClientWeb,
  profileId: string | undefined,
) =>
  createNotificationMutationOptions({
    queryClient,
    profileId,
    mutationKey: archiveMutationKey,
    mutationFn: function archiveNotification({
      id,
    }: NotificationsArchiveData["path"]) {
      return notificationsArchive({
        client: httpClientApi.sdkClient,
        path: { id },
      })
    },
    applyOptimisticUpdate: ({ id }: { id: number }, snapshot) => {
      const removed = snapshot.previousNotifications?.find((n) => n.id === id)

      queryClient.setQueryData<NotificationsListResponse>(
        inboxNotificationsQueryKey(profileId),
        (old) => old?.filter((n) => n.id !== id),
      )

      if (removed && !removed.seenAt) {
        queryClient.setQueryData<NotificationsUnreadCountResponse>(
          unreadCountQueryKey(profileId),
          (old) => (old ? { count: Math.max(0, old.count - 1) } : old),
        )
      }
    },
  })

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation(
    archiveMutationOptions(queryClient, httpClientApi, activeProfileId),
  )
}
