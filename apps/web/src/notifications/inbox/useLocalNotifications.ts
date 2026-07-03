import { useMemo } from "react"
import type { NotificationSeverity } from "@oboku/shared"
import { useActiveProfile } from "../../profiles"
import { ROUTES } from "../../navigation/routes"

export type LocalNotification = {
  id: string
  severity: NotificationSeverity
  title: string
  body: string | null
  action?: {
    label: string
    to: string
  }
}

export const useLocalNotifications = (): LocalNotification[] => {
  const needsRelogin = useActiveProfile().data?.needsRelogin ?? false

  return useMemo(() => {
    const notifications: LocalNotification[] = []

    if (needsRelogin) {
      notifications.push({
        id: "session_expired",
        severity: "warning",
        title: "Session expired",
        body: "Your session has expired. Please sign in again to continue.",
        action: {
          label: "Sign in again",
          to: ROUTES.SESSION_EXPIRED,
        },
      })
    }

    return notifications
  }, [needsRelogin])
}
