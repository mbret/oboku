import { memo, useEffect } from "react"
import { notify } from "../notifications/toasts"
import { useActiveProfile } from "../profiles"

export const NotifyExpiredSession = memo(function NotifyExpiredSession() {
  const needsReLogin = useActiveProfile().data?.needsRelogin ?? false

  useEffect(
    function notifyWhenSessionExpired() {
      if (!needsReLogin) return

      notify({
        title: "Session expired",
        description:
          "Your session has expired. Please check your notifications and sign in again to continue.",
        severity: "warning",
      })
    },
    [needsReLogin],
  )

  return null
})
