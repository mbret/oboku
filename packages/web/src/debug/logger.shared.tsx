import { captureMessage } from "@sentry/react"
import { isDebugEnabled } from "./isDebugEnabled.shared"

const noop = () => {}

export const Logger = {
  log: (...data: any[]) => {
    if (import.meta.env.DEV || isDebugEnabled()) {
      console.log(`[oboku:log]`, ...data)
    }
  },
  info:
    import.meta.env.DEV || isDebugEnabled()
      ? Function.prototype.bind.call(console.info, console, `[oboku:info]`)
      : noop,
  /**
   * Using console.error as it is will make sure to report it
   * to sentry
   */
  error: (...data: any[]) => {
    console.error(`[oboku:error]`, ...data)
  },
  captureMessage: (
    message: string,
    captureContext?: Parameters<typeof captureMessage>[1],
  ) => {
    captureMessage(message, captureContext)
  },
  warn: (...data: any[]) => {
    if (import.meta.env.DEV || isDebugEnabled()) {
      console.warn(`[oboku:warning]`, ...data)
    }
  },
}
