import { captureMessage } from "@sentry/react"
import { isDebugEnabled } from "./isDebugEnabled.shared"

const noop = () => {}

export const Report = {
  log: (...data: any[]) => {
    if (import.meta.env.DEV || isDebugEnabled()) {
      // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error(`[oboku:error]`, ...data)
  },
  captureMessage: (
    message: string,
    captureContext?: Parameters<typeof captureMessage>[1]
  ) => {
    captureMessage(message, captureContext)
  },
  warn: (...data: any[]) => {
    if (import.meta.env.DEV || isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(`[oboku:warning]`, ...data)
    }
  },
  metric: (
    performanceEntry: PerformanceEntry | { name: string; duration: number },
    targetDuration = Infinity
  ) => {
    const duration =
      typeof performanceEntry === "number"
        ? performanceEntry
        : performanceEntry.duration
    if (import.meta.env.DEV || isDebugEnabled()) {
      if (performanceEntry.duration <= targetDuration) {
        // eslint-disable-next-line no-console
        console.log(
          `[oboku:metric] `,
          `${performanceEntry.name} took ${duration}ms (${duration / 1000})s`
        )
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[oboku:metric] `,
          `${performanceEntry.name} took ${performanceEntry.duration}ms which is above the ${targetDuration}ms target for this function`
        )
      }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurePerformance: <F extends (...args: any[]) => any>(
    name: string,
    targetDuration = 10,
    functionToMeasure: F
  ) => {
    return (...args: Parameters<F>): ReturnType<F> => {
      const t0 = performance.now()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = functionToMeasure(...(args as any))

      if (response && response.then) {
        return response.then((res: any) => {
          const t1 = performance.now()
          Report.metric({ name, duration: t1 - t0 }, targetDuration)
          return res
        })
      }

      const t1 = performance.now()
      Report.metric({ name, duration: t1 - t0 }, targetDuration)

      return response
    }
  }
}
