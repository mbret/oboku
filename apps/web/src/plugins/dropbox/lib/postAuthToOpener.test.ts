import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("postAuthToOpener", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("posts auth params back to the opener using the app origin", async () => {
    const postMessage = vi.fn()
    const close = vi.fn()

    vi.stubGlobal("window", {
      close,
      location: {
        origin: "https://app.oboku.me",
        search: "?code=reader-code&state=reader-state",
      },
      opener: {
        postMessage,
      },
    })

    await import("./postAuthToOpener")

    expect(postMessage).toHaveBeenCalledWith(
      {
        source: "oauth-redirect",
        params: "?code=reader-code&state=reader-state",
      },
      "https://app.oboku.me",
    )
    expect(close).toHaveBeenCalled()
  })

  it("does nothing when the popup has no opener", async () => {
    const close = vi.fn()

    vi.stubGlobal("window", {
      close,
      location: {
        origin: "https://app.oboku.me",
        search: "?code=reader-code",
      },
      opener: null,
    })

    await import("./postAuthToOpener")

    expect(close).not.toHaveBeenCalled()
  })
})
