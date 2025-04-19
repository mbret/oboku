import { useCallback } from "react"
import {
  notificationsSubject,
  type AppNotification,
} from "./NotificationsProvider"
import { errorToMessage } from "../errors/ErrorMessage"

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

  const notifyError = useCallback(
    (error: unknown) => {
      notify({
        title: "Error",
        description: errorToMessage(error),
        severity: "error",
      })
    },
    [notify],
  )

  return { notify, notifyError }
}
