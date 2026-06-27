import { useMemo } from "react"
import type { NotificationSeverity } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../../auth/states.web"

/**
 * A notification produced entirely on the client (no server backing).
 * Unlike inbox notifications it has no persisted id / seen / archived state:
 * it lives only as long as the condition that produced it.
 */
export type LocalNotification = {
  id: string
  severity: NotificationSeverity
  title: string
  body: string | null
}

/**
 * Client-side notifications derived from local app state. This is the only
 * place that knows about `needsRelogin` (and any future local conditions),
 * keeping the inbox/badge code generic.
 */
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
