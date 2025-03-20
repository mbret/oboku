// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { authStateSignal } from "../auth/authState"
import { setUser } from "@sentry/react"

function initializeAnalytics() {
  const firebaseConfig = JSON.parse(
    import.meta.env.VITE_FIREBASE_CONFIG ?? "{}",
  )

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
