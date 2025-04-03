import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { authStateSignal } from "../auth/states.web"
import { setUser } from "@sentry/react"
import { configuration } from "../config/configuration"

function initializeAnalytics() {
  if (!configuration.VITE_FIREBASE_CONFIG) return undefined

  const firebaseConfig = JSON.parse(configuration.VITE_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig)

  return getAnalytics(app)
}

function registerUsersOnSentrySession() {
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
}

registerUsersOnSentrySession()

export const analytics = initializeAnalytics()
