import { useMemo } from "react"
import type { NotificationSeverity } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../../auth/states.web"

export type LocalNotification = {
  id: string
  severity: NotificationSeverity
  title: string
  body: string | null
}

export const useLocalNotifications = (): LocalNotification[] => {
  const needsRelogin = useSignalValue(authStateSignal)?.needsRelogin ?? false

  return useMemo(() => {
    const notifications: LocalNotification[] = []

    if (needsRelogin) {
      notifications.push({
        id: "session_expired",
        severity: "warning",
        title: "Session expired",
        body: "Your session has expired. Please sign in again to continue.",
      })
    }

    return notifications
  }, [needsRelogin])
}
