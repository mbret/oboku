import { retryBackoff } from "reactjrx"
import type { Observable } from "rxjs"
import { reportErrors } from "../rxjs/operators"
import { whenOnLine$ } from "./onLine"

const RETRY_DELAY_MS = 1000
const RETRY_MAX_DELAY_MS = 5 * 60 * 1000

/**
 * Reports each failure and retries once the device is online, waiting a
 * second the first time and twice as long each time after, up to five minutes.
 */
export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    reportErrors,
    retryBackoff({
      initialInterval: RETRY_DELAY_MS,
      maxInterval: RETRY_MAX_DELAY_MS,
      retryAfter: function waitForDeviceOnLine() {
        return whenOnLine$
      },
    }),
  )
