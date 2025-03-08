import { version } from "../../package.json"
import { SENTRY_DSN } from "../constants.shared"
import {
  init,
  captureConsoleIntegration,
  extraErrorDataIntegration,
  httpClientIntegration,
} from "@sentry/react"

init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !import.meta.env.DEV,
  integrations: [
    captureConsoleIntegration({
      levels: ["error"],
    }),
    extraErrorDataIntegration(),
    httpClientIntegration(),
  ],
  sendDefaultPii: true,
  release: version,
  beforeSend(event) {
    // Check if it is an exception, and if so, show the report dialog
    // if (event.exception) {
    //   showReportDialog({ eventId: event.event_id })
    // }

    return event
  },
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
})
