import * as Sentry from "@sentry/react"

export const Report = {
  error: (err: any) => {
    if (process.env.NODE_ENV !== 'development') {
      Sentry.captureException(err)
    }
    console.error(err)
  },
  captureMessage: (message: string, captureContext?: Parameters<typeof Sentry.captureMessage>[1]) => {
    Sentry.captureMessage(message, captureContext)
  },
  warn: (message: string) => {
    console.warn(`[oboku:warning]`, message)
  }
}