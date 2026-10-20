import { first } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { navigatorOnLine$, whenOnLine$ } from "./onLine"

const setOnLine = (onLine: boolean) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine)
  window.dispatchEvent(new Event(onLine ? "online" : "offline"))
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
