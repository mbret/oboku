import { memo } from "react"
import type { UserNotification } from "@oboku/shared"
import { NotificationCardBase } from "./NotificationCardBase"

type AdminBroadcastNotification = Extract<
  UserNotification,
  { kind: "admin_broadcast" }
>

export const AdminBroadcastNotificationCard = memo(
  function AdminBroadcastNotificationCard({
    notification,
  }: {
    notification: AdminBroadcastNotification
  }) {
    return <NotificationCardBase notification={notification} />
  },
)
