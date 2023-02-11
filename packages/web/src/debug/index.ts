import * as Sentry from "@sentry/react"
import { BrowserTracing } from "@sentry/tracing"
// import firebase from "firebase/compat/app"
// import { getAnalytics } from "firebase/analytics";
// import { FIREBASE_BASE_CONFIG } from '../constants'
import ReactGA from "react-ga"
import { version } from "../../package.json"
import localforage from "localforage"
import { isDebugEnabled } from "./isDebugEnabled.shared"
import "./reportWebVitals"
import { SENTRY_DSN } from "../constants.shared"

ReactGA.initialize("UA-43281094-4")

// @ts-ignore
window.localforage = localforage

Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !import.meta.env.DEV,
  autoSessionTracking: true,
  integrations: [new BrowserTracing()],
  release: version,
  beforeSend(event) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id })
    }

    return event
  },
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0
})

// firebase.initializeApp(FIREBASE_BASE_CONFIG)
// getAnalytics()

if (!isDebugEnabled()) {
  console.log = () => {}
  console.warn = () => {}
}

export const toggleDebug = () => {
  if (isDebugEnabled()) {
    localStorage.setItem("oboku_debug_enabled", "false")
  } else {
    localStorage.setItem("oboku_debug_enabled", "true")
  }
  window.location.reload()
}
