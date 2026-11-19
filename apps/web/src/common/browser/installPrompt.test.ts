import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest"
import { installPrompt$ } from "./installPrompt"
import { offerInstallPrompt, reportAppInstalled } from "./installPrompt.fixture"

const observeInstallPrompt = () => {
  const receiveInstallPrompt = vi.fn()
  const subscription = installPrompt$.subscribe(receiveInstallPrompt)

  onTestFinished(function stopObserving() {
    subscription.unsubscribe()
  })

  return receiveInstallPrompt
}

describe("installPrompt$", () => {
  afterEach(function leaveNoOfferForTheNextTest() {
    reportAppInstalled()
  })

  it("holds no prompt before the browser offers the install", () => {
    const receiveInstallPrompt = observeInstallPrompt()

    expect(receiveInstallPrompt).toHaveBeenCalledExactlyOnceWith(null)
  })

  it("holds the prompt the browser offers", () => {
    const receiveInstallPrompt = observeInstallPrompt()

    const { installPrompt } = offerInstallPrompt()

    expect(receiveInstallPrompt).toHaveBeenLastCalledWith(installPrompt)
  })

  it("gives a later subscriber the prompt offered before it subscribed", () => {
    observeInstallPrompt()
    const { installPrompt } = offerInstallPrompt()

    const receiveInstallPrompt = observeInstallPrompt()

    expect(receiveInstallPrompt).toHaveBeenCalledExactlyOnceWith(installPrompt)
  })

  it("drops the prompt once the user answered its dialog", async () => {
    const receiveInstallPrompt = observeInstallPrompt()
    const { answerInstallDialog } = offerInstallPrompt()

    answerInstallDialog({ outcome: "dismissed", platform: "" })

    await expect.poll(() => receiveInstallPrompt.mock.lastCall).toEqual([null])
  })

  it("holds the next prompt the browser offers after a dismissal", async () => {
    const receiveInstallPrompt = observeInstallPrompt()
    const { answerInstallDialog } = offerInstallPrompt()
    answerInstallDialog({ outcome: "dismissed", platform: "" })
    await expect.poll(() => receiveInstallPrompt.mock.lastCall).toEqual([null])

    const { installPrompt: nextInstallPrompt } = offerInstallPrompt()

    expect(receiveInstallPrompt).toHaveBeenLastCalledWith(nextInstallPrompt)
  })

  it("keeps the newer prompt when the older one is answered late", async () => {
    const receiveInstallPrompt = observeInstallPrompt()
    const older = offerInstallPrompt()
    const newer = offerInstallPrompt()

    older.answerInstallDialog({ outcome: "dismissed", platform: "" })
    newer.answerInstallDialog({ outcome: "dismissed", platform: "" })
    await expect.poll(() => receiveInstallPrompt.mock.lastCall).toEqual([null])

    expect(receiveInstallPrompt.mock.calls).toEqual([
      [null],
      [older.installPrompt],
      [newer.installPrompt],
      [null],
    ])
  })

  it("drops the prompt once the app is installed", () => {
    const receiveInstallPrompt = observeInstallPrompt()
    offerInstallPrompt()

    reportAppInstalled()

    expect(receiveInstallPrompt).toHaveBeenLastCalledWith(null)
  })
})
