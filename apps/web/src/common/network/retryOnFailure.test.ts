import { defer, throwError } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Logger } from "../../debug/logger.shared"
import { retryOnFailure } from "./retryOnFailure"

const RETRY_DELAY_MS = 1000
const RETRY_MAX_DELAY_MS = 5 * 60 * 1000

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
}

const failingAttempt = vi.fn(function failToLoad() {
  return new Error("script failed to load")
})

const subscribeToFailingLoad = () =>
  defer(function attemptLoad() {
    return throwError(failingAttempt)
  })
    .pipe(retryOnFailure)
    .subscribe()

describe("retryOnFailure", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    failingAttempt.mockClear()
    vi.spyOn(Logger, "error").mockImplementation(function silenceLogger() {})
    setOnLine(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("retries a failure a second later", async () => {
    const subscription = subscribeToFailingLoad()
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS - 1)

    expect(failingAttempt).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1)

    expect(failingAttempt).toHaveBeenCalledTimes(2)

    subscription.unsubscribe()
  })

  it("waits twice as long after each failure, up to five minutes", async () => {
    const expectedDelays = [
      1000,
      2000,
      4000,
      8000,
      16_000,
      32_000,
      64_000,
      128_000,
      256_000,
      RETRY_MAX_DELAY_MS,
      RETRY_MAX_DELAY_MS,
    ]
    const subscription = subscribeToFailingLoad()

    for (const [retry, delay] of expectedDelays.entries()) {
      await vi.advanceTimersByTimeAsync(delay - 1)

      expect(failingAttempt).toHaveBeenCalledTimes(retry + 1)

      await vi.advanceTimersByTimeAsync(1)

      expect(failingAttempt).toHaveBeenCalledTimes(retry + 2)
    }

    subscription.unsubscribe()
  })

  it("waits for the device to be back online to retry", async () => {
    setOnLine(false)
    const subscription = subscribeToFailingLoad()
    await vi.advanceTimersByTimeAsync(RETRY_MAX_DELAY_MS)

    expect(failingAttempt).toHaveBeenCalledOnce()

    setOnLine(true)
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS)

    expect(failingAttempt).toHaveBeenCalledTimes(2)

    subscription.unsubscribe()
  })

  it("reports each failure", async () => {
    const subscription = subscribeToFailingLoad()
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS)

    expect(Logger.error).toHaveBeenCalledTimes(2)
    expect(Logger.error).toHaveBeenNthCalledWith(
      1,
      failingAttempt.mock.results[0]?.value,
    )
    expect(Logger.error).toHaveBeenNthCalledWith(
      2,
      failingAttempt.mock.results[1]?.value,
    )

    subscription.unsubscribe()
  })
})
