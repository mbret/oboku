import { memo, useEffect } from "react"
import { setUser } from "@sentry/react"
import { useActiveProfile } from "../profiles"

export const SyncSentryUser = memo(function SyncSentryUser() {
  const { data: auth } = useActiveProfile()

  useEffect(
    function syncSentryUser() {
      if (auth) {
        setUser({ email: auth.email, id: auth.nameHex, username: auth.dbName })
      } else {
        setUser(null)
      }
    },
    [auth],
  )

  return null
})
