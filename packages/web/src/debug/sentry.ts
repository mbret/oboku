import { version } from "../../package.json"
import "./reportWebVitals"
import { SENTRY_DSN } from "../constants.shared"
import { init, showReportDialog } from "@sentry/react"
import { CaptureConsole } from "@sentry/integrations"

init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !import.meta.env.DEV,
  autoSessionTracking: true,
  integrations: [
    new CaptureConsole({
      levels: ["error"]
    })
  ],
  release: version,
  beforeSend(event) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception) {
      showReportDialog({ eventId: event.event_id })
    }

    return event
  },
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0
})
