import { useCallback } from "react"
import {
  notificationsSubject,
  type AppNotification,
} from "./NotificationsProvider"

export const useNotifications = () => {
  const notify = useCallback(
    (notification: AppNotification | "actionSuccess") => {
      if (notification === "actionSuccess") {
        notificationsSubject.next({
          title: "Action successful",
          description: "Action successful",
          severity: "success",
        })
      } else {
        notificationsSubject.next(notification)
      }
    },
    [],
  )

  return { notify }
}
