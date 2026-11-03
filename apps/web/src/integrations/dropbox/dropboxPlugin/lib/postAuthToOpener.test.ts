import { describe, expect, it, onTestFinished, vi } from "vitest"

const callbackPage = "/auth-callback-dropbox.html"
const settledMessage = "callback-page-settled"

const collectMessagesFrom = (getSource: () => MessageEventSource | null) => {
  const events: MessageEvent[] = []

  function collectMessageFromSource(event: MessageEvent) {
    if (event.source === getSource()) events.push(event)
  }

  window.addEventListener("message", collectMessageFromSource)
  onTestFinished(function stopCollectingMessages() {
    window.removeEventListener("message", collectMessageFromSource)
  })

  return events
}

const loadInFrame = async (url: string) => {
  const frame = document.createElement("iframe")
  const loaded = new Promise(function waitForFrameLoad(resolve) {
    frame.addEventListener("load", resolve, { once: true })
  })

  frame.src = url
  document.body.append(frame)
  onTestFinished(function removeFrame() {
    frame.remove()
  })

  await loaded

  return frame
}

/**
 * Messages from one window reach another in the order they were posted, so
 * once this one arrives, every message the page posted while loading has too.
 */
const postSettledFromFrame = (frame: HTMLIFrameElement) => {
  const frameDocument = frame.contentDocument

  if (!frameDocument) throw new Error("the callback page is not same-origin")

  const script = frameDocument.createElement("script")

  script.textContent = `parent.postMessage(${JSON.stringify(settledMessage)}, location.origin)`
  frameDocument.body.append(script)
}

describe("postAuthToOpener", () => {
  it("posts auth params back to the opener using the app origin", async () => {
    let popup: Window | null = null
    const events = collectMessagesFrom(() => popup)

    popup = window.open(`${callbackPage}?code=reader-code&state=reader-state`)

    await vi.waitFor(function waitForTheAuthParams() {
      expect(events).toHaveLength(1)
    })

    expect(events[0]?.data).toEqual({
      source: "oauth-redirect",
      params: "?code=reader-code&state=reader-state",
    })
    expect(events[0]?.origin).toBe(window.location.origin)
    await vi.waitFor(function waitForThePopupToClose() {
      expect(popup?.closed).toBe(true)
    })
  })

  it("does nothing when the popup has no opener", async () => {
    let frame: HTMLIFrameElement | null = null
    const events = collectMessagesFrom(() => frame?.contentWindow ?? null)

    frame = await loadInFrame(`${callbackPage}?code=reader-code`)
    postSettledFromFrame(frame)

    await vi.waitFor(function waitForTheFrameToSettle() {
      expect(events.map((event) => event.data)).toContain(settledMessage)
    })
    expect(events.map((event) => event.data)).toEqual([settledMessage])
  })
})
