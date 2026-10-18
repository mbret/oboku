import { memo } from "react"
import type { AdminBroadcastNotificationDto } from "@oboku/shared"
import { NotificationCardBase } from "./NotificationCardBase"

export const AdminBroadcastNotificationCard = memo(
  function AdminBroadcastNotificationCard({
    notification,
  }: {
    notification: AdminBroadcastNotificationDto
  }) {
    return <NotificationCardBase notification={notification} />
  },
)
