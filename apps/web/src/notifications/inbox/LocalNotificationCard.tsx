import { memo } from "react"
import { Alert, AlertTitle } from "@mui/material"
import type { LocalNotification } from "./useLocalNotifications"

export const LocalNotificationCard = memo(function LocalNotificationCard({
  notification,
}: {
  notification: LocalNotification
}) {
  return (
    <Alert
      severity={notification.severity}
      sx={{ "& .MuiAlert-message": { flexGrow: 1 } }}
    >
      <AlertTitle>{notification.title}</AlertTitle>
      {notification.body}
    </Alert>
  )
})
