import * as Sentry from "@sentry/react"
import { isDebugEnabled } from "./isDebugEnabled.shared";

export const Report = {
  log: (...data: any[]) => {
    if (process.env.NODE_ENV === 'development' || isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(`[oboku:log]`, ...data);
    }
  },
  error: (err: any) => {
    if (process.env.NODE_ENV !== 'development' || isDebugEnabled()) {
      Sentry.captureException(err)
    }
    console.error(err)
  },
  captureMessage: (message: string, captureContext?: Parameters<typeof Sentry.captureMessage>[1]) => {
    Sentry.captureMessage(message, captureContext)
  },
  warn: (message: string) => {
    if (process.env.NODE_ENV === 'development' || isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(`[oboku:warning]`, message)
    }
  },
  metric: (performanceEntry: PerformanceEntry | { name: string; duration: number }, targetDuration = Infinity) => {
    const duration = typeof performanceEntry === 'number' ? performanceEntry : performanceEntry.duration;
    if (process.env.NODE_ENV === 'development' || isDebugEnabled()) {
      if (performanceEntry.duration <= targetDuration) {
        // eslint-disable-next-line no-console
        console.log(`[oboku:metric] `, `${performanceEntry.name} took ${duration}ms`);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[oboku:metric] `,
          `${performanceEntry.name} took ${performanceEntry.duration}ms which is above the ${targetDuration}ms target for this function`,
        );
      }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurePerformance: <F extends (...args: any[]) => any>(name: string, targetDuration = 10, functionToMeasure: F) => {
    return (...args: Parameters<F>): ReturnType<F> => {
      const t0 = performance.now();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = functionToMeasure(...(args as any));

      if (response && response.then) {
        return response.then((res: any) => {
          const t1 = performance.now();
          Report.metric({ name, duration: t1 - t0 }, targetDuration);
          return res;
        });
      }

      const t1 = performance.now();
      Report.metric({ name, duration: t1 - t0 }, targetDuration);

      return response;
    };
  },
}