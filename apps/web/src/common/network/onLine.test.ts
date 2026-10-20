import { defer, first, of, throwError } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { navigatorOnLine$, retryWhenOnLine, whenOnLine$ } from "./onLine"

const QUICK_RETRY_COUNT = 5
const SLOW_RETRY_DELAY_MS = 5 * 60 * 1000

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
}

const createAttemptFailingTimes = (failureCount: number) => {
  const attempt = vi.fn(function succeed() {
    return of("done")
  })

  for (let failure = 0; failure < failureCount; failure++) {
    attempt.mockReturnValueOnce(throwError(() => new Error("unreachable")))
  }

  return attempt
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("navigatorOnLine$", () => {
  it("gives the current status right away to a subscriber that comes while another one is subscribed", () => {
    const earlierSubscription = navigatorOnLine$.subscribe()
    const receiveOnLine = vi.fn()

    navigatorOnLine$.pipe(first()).subscribe(receiveOnLine)
    earlierSubscription.unsubscribe()

    expect(receiveOnLine).toHaveBeenCalledExactlyOnceWith(navigator.onLine)
  })
})

describe("whenOnLine$", () => {
  it("emits right away when the device is online", () => {
    setOnLine(true)
    const onOnLine = vi.fn()

    whenOnLine$.subscribe(onOnLine)

    expect(onOnLine).toHaveBeenCalledOnce()
  })

  it("waits for the device to be back online", () => {
    setOnLine(false)
    const onOnLine = vi.fn()

    whenOnLine$.subscribe(onOnLine)

    expect(onOnLine).not.toHaveBeenCalled()

    setOnLine(true)

    expect(onOnLine).toHaveBeenCalledOnce()
  })
})

describe("retryWhenOnLine", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("retries a moment later while the device is online", async () => {
    setOnLine(true)
    const attempt = createAttemptFailingTimes(1)
    const onDone = vi.fn()

    defer(attempt).pipe(retryWhenOnLine).subscribe(onDone)

    expect(attempt).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1)

    expect(attempt).toHaveBeenCalledTimes(2)
    expect(onDone).toHaveBeenCalledExactlyOnceWith("done")
  })

  it("waits five minutes between retries once the first few have failed", async () => {
    setOnLine(true)
    const attempt = createAttemptFailingTimes(QUICK_RETRY_COUNT + 1)
    const onDone = vi.fn()

    defer(attempt).pipe(retryWhenOnLine).subscribe(onDone)
    await vi.advanceTimersByTimeAsync(QUICK_RETRY_COUNT)

    expect(attempt).toHaveBeenCalledTimes(QUICK_RETRY_COUNT + 1)

    await vi.advanceTimersByTimeAsync(SLOW_RETRY_DELAY_MS - 1)

    expect(onDone).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(onDone).toHaveBeenCalledExactlyOnceWith("done")
  })

  it("retries once the device is back online when it is offline", async () => {
    setOnLine(false)
    const attempt = createAttemptFailingTimes(1)
    const onDone = vi.fn()

    defer(attempt).pipe(retryWhenOnLine).subscribe(onDone)
    await vi.advanceTimersByTimeAsync(SLOW_RETRY_DELAY_MS)

    expect(attempt).toHaveBeenCalledOnce()

    setOnLine(true)

    expect(onDone).toHaveBeenCalledExactlyOnceWith("done")
  })
})
