import { authStateSignal } from "../../auth/authState"
import * as Sentry from "@sentry/react"

authStateSignal.subject.subscribe((auth) => {
  if (auth) {
    Sentry.setUser({
      email: auth.email,
      id: auth.nameHex,
      username: auth.dbName
    })
  } else {
    Sentry.setUser(null)
  }
})
