import { authStateSignal } from "../../auth/authState"
import { setUser } from "@sentry/react"

authStateSignal.subject.subscribe((auth) => {
  if (auth) {
    setUser({
      email: auth.email,
      id: auth.nameHex,
      username: auth.dbName,
    })
  } else {
    setUser(null)
  }
})
