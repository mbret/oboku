import { first } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { navigatorOnLine$ } from "./onLine"

describe("navigatorOnLine$", () => {
  it("gives the current status right away to a subscriber that comes while another one is subscribed", () => {
    const earlierSubscription = navigatorOnLine$.subscribe()
    const receiveOnLine = vi.fn()

    navigatorOnLine$.pipe(first()).subscribe(receiveOnLine)
    earlierSubscription.unsubscribe()

    expect(receiveOnLine).toHaveBeenCalledExactlyOnceWith(navigator.onLine)
  })
})
