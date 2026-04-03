import type { useQueryClient } from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

export const inboxNotificationsQueryKey = [
  API_QUERY_KEY_PREFIX,
  "notifications",
  "list",
] as const
export const unreadCountQueryKey = [
  API_QUERY_KEY_PREFIX,
  "notifications",
  "unread-count",
] as const

export const markSeenMutationKey = [
  API_QUERY_KEY_PREFIX,
  "notifications",
  "markSeen",
] as const
export const markAllSeenMutationKey = [
  API_QUERY_KEY_PREFIX,
  "notifications",
  "markAllSeen",
] as const
export const archiveMutationKey = [
  API_QUERY_KEY_PREFIX,
  "notifications",
  "archive",
] as const

type QueryClient = ReturnType<typeof useQueryClient>

export const invalidateNotificationQueries = async (
  queryClient: QueryClient,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: inboxNotificationsQueryKey }),
    queryClient.invalidateQueries({ queryKey: unreadCountQueryKey }),
  ])
}

export const cancelAndSnapshotNotificationQueries = async (
  queryClient: QueryClient,
) => {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: inboxNotificationsQueryKey }),
    queryClient.cancelQueries({ queryKey: unreadCountQueryKey }),
  ])

  return {
    previousNotifications: queryClient.getQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey,
    ),
    previousCount:
      queryClient.getQueryData<GetUnreadNotificationsCountResponse>(
        unreadCountQueryKey,
      ),
  }
}

export type NotificationCacheSnapshot = Awaited<
  ReturnType<typeof cancelAndSnapshotNotificationQueries>
>

export const rollbackNotificationCaches = (
  queryClient: QueryClient,
  context?: NotificationCacheSnapshot,
) => {
  if (context?.previousNotifications) {
    queryClient.setQueryData(
      inboxNotificationsQueryKey,
      context.previousNotifications,
    )
  }
  if (context?.previousCount) {
    queryClient.setQueryData(unreadCountQueryKey, context.previousCount)
  }
}
