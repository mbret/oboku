import { first } from "rxjs"
import { describe, expect, it } from "vitest"
import { navigatorOnLine$ } from "./onLine"

describe("navigatorOnLine$", () => {
  it("gives the current status right away to a subscriber that comes while another one is subscribed", () => {
    const earlierSubscription = navigatorOnLine$.subscribe()
    let receivedOnLine: boolean | undefined

    navigatorOnLine$.pipe(first()).subscribe(function receiveOnLine(onLine) {
      receivedOnLine = onLine
    })
    earlierSubscription.unsubscribe()

    expect(receivedOnLine).toBe(navigator.onLine)
  })
})
