import { version } from "../../package.json"
import {
  init,
  captureConsoleIntegration,
  extraErrorDataIntegration,
  httpClientIntegration,
} from "@sentry/react"

if (import.meta.env.SENTRY_DSN) {
  init({
    dsn: import.meta.env.SENTRY_DSN,
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
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  })
}
