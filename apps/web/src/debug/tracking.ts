import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { configuration } from "../config/configuration"

function initializeAnalytics() {
  if (!configuration.VITE_FIREBASE_CONFIG) return undefined

  const firebaseConfig = JSON.parse(configuration.VITE_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig)

  return getAnalytics(app)
}

export const analytics = initializeAnalytics()
