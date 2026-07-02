import { useEffect } from "react"
import { setUser } from "@sentry/react"
import { useAuthSession } from "../auth/authSession"

export const useSyncSentryUser = () => {
  const { data: auth } = useAuthSession()

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
