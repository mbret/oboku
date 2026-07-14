import type { useQueryClient } from "@tanstack/react-query"
import type {
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from "@oboku/shared"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"

/**
 * Notifications are per-user session data persisted under the shared offline
 * snapshot, so their keys are scoped to the profile they belong to. Even if the
 * sign-out snapshot scrub loses its race with a reload, a different profile
 * reads a different key and can never surface the previous user's cache.
 */
export const inboxNotificationsQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "notifications", profileId, "list"] as const
export const unreadCountQueryKey = (profileId: string | undefined) =>
  [API_QUERY_KEY_PREFIX, "notifications", profileId, "unread-count"] as const

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
  profileId: string | undefined,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: inboxNotificationsQueryKey(profileId),
    }),
    queryClient.invalidateQueries({ queryKey: unreadCountQueryKey(profileId) }),
  ])
}

export const cancelAndSnapshotNotificationQueries = async (
  queryClient: QueryClient,
  profileId: string | undefined,
) => {
  await Promise.all([
    queryClient.cancelQueries({
      queryKey: inboxNotificationsQueryKey(profileId),
    }),
    queryClient.cancelQueries({ queryKey: unreadCountQueryKey(profileId) }),
  ])

  return {
    previousNotifications: queryClient.getQueryData<GetNotificationsResponse>(
      inboxNotificationsQueryKey(profileId),
    ),
    previousCount:
      queryClient.getQueryData<GetUnreadNotificationsCountResponse>(
        unreadCountQueryKey(profileId),
      ),
  }
}

export type NotificationCacheSnapshot = Awaited<
  ReturnType<typeof cancelAndSnapshotNotificationQueries>
>

export const rollbackNotificationCaches = (
  queryClient: QueryClient,
  profileId: string | undefined,
  context?: NotificationCacheSnapshot,
) => {
  if (context?.previousNotifications) {
    queryClient.setQueryData(
      inboxNotificationsQueryKey(profileId),
      context.previousNotifications,
    )
  }
  if (context?.previousCount) {
    queryClient.setQueryData(
      unreadCountQueryKey(profileId),
      context.previousCount,
    )
  }
}
