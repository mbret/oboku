import { describe, expect, it, onTestFinished, vi } from "vitest"

const callbackPage = "/auth-callback-dropbox.html"
const settledMessage = "callback-page-settled"

const firstMessageFrom = (getSource: () => MessageEventSource | null) => {
  const { promise, resolve } = Promise.withResolvers<MessageEvent>()

  function resolveWithMessageFromSource(event: MessageEvent) {
    if (event.source === getSource()) resolve(event)
  }

  window.addEventListener("message", resolveWithMessageFromSource)
  onTestFinished(function stopListeningToMessages() {
    window.removeEventListener("message", resolveWithMessageFromSource)
  })

  return promise
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
    const authMessage = firstMessageFrom(() => popup)

    popup = window.open(`${callbackPage}?code=reader-code&state=reader-state`)

    const { data, origin } = await authMessage

    expect(data).toEqual({
      source: "oauth-redirect",
      params: "?code=reader-code&state=reader-state",
    })
    expect(origin).toBe(window.location.origin)
    await vi.waitFor(function waitForThePopupToClose() {
      expect(popup?.closed).toBe(true)
    })
  })

  it("does nothing when the popup has no opener", async () => {
    let frame: HTMLIFrameElement | null = null
    const firstMessage = firstMessageFrom(() => frame?.contentWindow ?? null)

    frame = await loadInFrame(`${callbackPage}?code=reader-code`)
    postSettledFromFrame(frame)

    expect((await firstMessage).data).toBe(settledMessage)
  })
})
