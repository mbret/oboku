import { captureMessage } from "@sentry/react"
import { isDebugEnabled } from "./isDebugEnabled.shared"

const noop = () => {}

export const Report = {
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
  metric: (
    performanceEntry: PerformanceEntry | { name: string; duration: number },
    targetDuration = Infinity,
  ) => {
    const duration =
      typeof performanceEntry === "number"
        ? performanceEntry
        : performanceEntry.duration
    if (import.meta.env.DEV || isDebugEnabled()) {
      if (performanceEntry.duration <= targetDuration) {
        console.log(
          `[oboku:metric] `,
          `${performanceEntry.name} took ${duration}ms (${duration / 1000})s`,
        )
      } else {
        console.warn(
          `[oboku:metric] `,
          `${performanceEntry.name} took ${performanceEntry.duration}ms which is above the ${targetDuration}ms target for this function`,
        )
      }
    }
  },
  measurePerformance: <F extends (...args: any[]) => any>(
    name: string,
    // biome-ignore lint/style/useDefaultParameterLast: <explanation>
    targetDuration = 10,
    functionToMeasure: F,
  ) => {
    return (...args: Parameters<F>): ReturnType<F> => {
      const t0 = performance.now()

      const response = functionToMeasure(...(args as any))

      if (response?.then) {
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
  },
}
