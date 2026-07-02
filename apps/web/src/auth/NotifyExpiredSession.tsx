import { memo, useEffect } from "react"
import { notify } from "../notifications/toasts"
import { useActiveProfile } from "../profiles"

export const NotifyExpiredSession = memo(function NotifyExpiredSession() {
  const needsRelogin = useActiveProfile().data?.needsRelogin ?? false

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
