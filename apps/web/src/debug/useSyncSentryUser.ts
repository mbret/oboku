import { useEffect } from "react"
import { setUser } from "@sentry/react"
import { useActiveProfile } from "../profiles"

export const useSyncSentryUser = () => {
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
}
