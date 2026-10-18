import { memo } from "react"
import type { NotificationsListResponse } from "@oboku/shared"
import { SyncFinishedNotificationCard } from "./cards/SyncFinishedNotificationCard"
import { AdminBroadcastNotificationCard } from "./cards/AdminBroadcastNotificationCard"

export const NotificationCard = memo(function NotificationCard({
  notification,
}: {
  notification: NotificationsListResponse[number]
}) {
  switch (notification.kind) {
    case "sync_finished":
      return <SyncFinishedNotificationCard notification={notification} />
    case "admin_broadcast":
      return <AdminBroadcastNotificationCard notification={notification} />
    default:
      return null
  }
})
