import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { VITE_FIREBASE_CONFIG } from "../config"

function initializeAnalytics() {
  if (!VITE_FIREBASE_CONFIG) return undefined

  const firebaseConfig = JSON.parse(VITE_FIREBASE_CONFIG)

  const app = initializeApp(firebaseConfig)

  return getAnalytics(app)
}

export const analytics = initializeAnalytics()
