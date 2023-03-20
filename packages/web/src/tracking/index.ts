// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG ?? "{}")

// initialize Firebase
const app = initializeApp(firebaseConfig)

// initialize analytics
export const analytics = getAnalytics(app)
