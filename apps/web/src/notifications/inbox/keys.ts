import type { useQueryClient } from "@tanstack/react-query"

export const inboxNotificationsQueryKey = ["api", "notifications"] as const
export const unreadCountQueryKey = [
  "api",
  "notifications",
  "unread-count",
] as const

export const invalidateNotificationQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: inboxNotificationsQueryKey }),
    queryClient.invalidateQueries({ queryKey: unreadCountQueryKey }),
  ])
}
