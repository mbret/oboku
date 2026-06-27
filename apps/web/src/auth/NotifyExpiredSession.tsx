import { memo, useEffect } from "react"
import { useSignalValue } from "reactjrx"
import { notify } from "../notifications/toasts"
import { authStateSignal } from "./states.web"

export const NotifyExpiredSession = memo(function NotifyExpiredSession() {
  const needsRelogin = useSignalValue(authStateSignal)?.needsRelogin ?? false

  useEffect(() => {
    if (!needsRelogin) return

    notify({
      title: "Session expired",
      description:
        "Your session has expired. Please check your notifications and sign in again to continue.",
      severity: "warning",
    })
  }, [needsRelogin])

  return null
})
