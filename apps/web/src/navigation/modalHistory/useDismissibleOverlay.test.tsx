// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react"
import { StrictMode, useState } from "react"
import { MemoryRouter, useLocation, useNavigate } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ModalHistoryProvider } from "./ModalHistory"
import { useDismissibleOverlay } from "./useDismissibleOverlay"

/**
 * The provider + hook keep an overlay's lifecycle in sync with a browser
 * history entry. There is no DOM of its own to assert on, so the observable
 * surface is:
 *  - the router location (the `__oboku_modal` token in history `state`, and the
 *    location `key` which tells us whether the pushed entry was popped), and
 *  - the consumer's `onClose` callback.
 *
 * Every test drives a real `MemoryRouter` and asserts on those two things.
 */

// Distinct, unique tokens per open. jsdom's crypto.randomUUID varies by
// version, so we always provide our own (and Math.random is unavailable here).
beforeEach(() => {
  let n = 0
  vi.stubGlobal("crypto", {
    ...globalThis.crypto,
    randomUUID: () => `modal-token-${n++}`,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// Captured fresh on every render so the test can read the live values.
let latestClose: (afterClose?: () => void) => void
let latestNavigate: ReturnType<typeof useNavigate>
let currentLocation: ReturnType<typeof useLocation>

const Probe = () => {
  currentLocation = useLocation()
  latestNavigate = useNavigate()
  return null
}

const Overlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { close } = useDismissibleOverlay({ open, onClose })
  latestClose = close
  return null
}

const modalToken = () =>
  (currentLocation.state as { __oboku_modal?: string } | null)?.__oboku_modal

type Harness = {
  onClose: ReturnType<typeof vi.fn>
  /** Open the overlay and wait until its history entry is reserved. */
  open: () => Promise<void>
  /** Press the browser/mobile back button (pops the entry directly). */
  back: () => Promise<void>
  /** Dismiss through the hook's returned `close` (optionally with a callback). */
  close: (afterClose?: () => void) => Promise<void>
  /** Flip `open` to false from the outside, bypassing `close`. */
  externalClose: () => Promise<void>
  /** True when we are back on the entry that existed before opening. */
  atBase: () => boolean
}

const setup = (): Harness => {
  const onClose = vi.fn()
  let setOpen!: (value: boolean) => void

  const Host = () => {
    const [open, setOpenState] = useState(false)
    setOpen = setOpenState

    return (
      <MemoryRouter initialEntries={["/"]}>
        <ModalHistoryProvider>
          <Probe />
          <Overlay
            open={open}
            // A faithful consumer: onClose flips its own state to false.
            onClose={() => {
              onClose()
              setOpenState(false)
            }}
          />
        </ModalHistoryProvider>
      </MemoryRouter>
    )
  }

  render(<Host />)
  const baseKey = currentLocation.key

  return {
    onClose,
    open: async () => {
      act(() => setOpen(true))
      await waitFor(() => expect(modalToken()).toBeTruthy())
    },
    back: async () => {
      act(() => latestNavigate(-1))
      await waitFor(() => expect(modalToken()).toBeUndefined())
    },
    close: async (afterClose) => {
      act(() => latestClose(afterClose))
      await waitFor(() => expect(modalToken()).toBeUndefined())
    },
    externalClose: async () => {
      act(() => setOpen(false))
      await waitFor(() => expect(modalToken()).toBeUndefined())
    },
    atBase: () => currentLocation.key === baseKey,
  }
}

describe("useDismissibleOverlay", () => {
  describe("opening", () => {
    it("does not push a history entry or call onClose while closed", () => {
      const { onClose, atBase } = setup()

      expect(modalToken()).toBeUndefined()
      expect(atBase()).toBe(true)
      expect(onClose).not.toHaveBeenCalled()
    })

    it("pushes a dedicated history entry when opened", async () => {
      const { open, onClose, atBase } = setup()

      await open()

      expect(modalToken()).toBeTruthy()
      expect(atBase()).toBe(false)
      // Opening must never be mistaken for a dismissal.
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe("dismissing via back navigation", () => {
    it("calls onClose exactly once and pops the entry", async () => {
      const { open, back, onClose, atBase } = setup()

      await open()
      await back()

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(modalToken()).toBeUndefined()
      expect(atBase()).toBe(true)
    })

    it("does not leave a dangling entry or double-fire onClose", async () => {
      const { open, back, onClose, atBase } = setup()

      await open()
      await back()
      // Give any stray reconciling pop a chance to (wrongly) run.
      await waitFor(() => expect(atBase()).toBe(true))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("dismissing via the returned close()", () => {
    it("calls onClose exactly once and pops the entry", async () => {
      const { open, close, onClose, atBase } = setup()

      await open()
      await close()

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(modalToken()).toBeUndefined()
      expect(atBase()).toBe(true)
    })

    it("runs the afterClose callback once the entry is popped", async () => {
      const { open, close } = setup()
      const afterClose = vi.fn()

      await open()
      await close(afterClose)

      expect(afterClose).toHaveBeenCalledTimes(1)
    })

    it("still runs afterClose together with onClose", async () => {
      const { open, close, onClose } = setup()
      const afterClose = vi.fn()

      await open()
      await close(afterClose)

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(afterClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("external close (open flipped to false, bypassing close)", () => {
    it("reconciles the dangling entry by popping it", async () => {
      const { open, externalClose, atBase } = setup()

      await open()
      await externalClose()

      expect(modalToken()).toBeUndefined()
      expect(atBase()).toBe(true)
    })

    it("does not echo back to onClose", async () => {
      const { open, externalClose, onClose } = setup()

      await open()
      await externalClose()
      // Let any late onExit echo settle before asserting.
      await waitFor(() => expect(onClose).not.toHaveBeenCalled())

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe("repeated cycles", () => {
    it("reserves a fresh entry on every open", async () => {
      const { open, close } = setup()

      await open()
      const firstToken = modalToken()
      await close()

      await open()
      const secondToken = modalToken()

      expect(firstToken).toBeTruthy()
      expect(secondToken).toBeTruthy()
      expect(secondToken).not.toBe(firstToken)
    })

    it("fires onClose once per genuine dismissal across cycles", async () => {
      const { open, back, close, onClose } = setup()

      await open()
      await back()
      await open()
      await close()

      expect(onClose).toHaveBeenCalledTimes(2)
    })

    it("survives back-to-back external closes without leaking entries", async () => {
      const { open, externalClose, onClose, atBase } = setup()

      await open()
      await externalClose()
      expect(atBase()).toBe(true)

      await open()
      await externalClose()
      expect(atBase()).toBe(true)

      // Neither external close should ever reach onClose.
      expect(onClose).not.toHaveBeenCalled()
    })

    it("handles a mix of external close then genuine dismissal", async () => {
      const { open, externalClose, back, onClose, atBase } = setup()

      await open()
      await externalClose()
      expect(onClose).not.toHaveBeenCalled()

      // A subsequent real back-dismissal must still fire onClose exactly once.
      await open()
      await back()

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(atBase()).toBe(true)
    })
  })
})

describe("ModalHistoryProvider — ghost entries", () => {
  it("pops a modal entry that no overlay backs (e.g. survived a reload)", async () => {
    // Post-reload stack: a base entry plus a leftover modal entry whose hash was
    // never registered this session (the registry is wiped on reload). Both
    // entries share the same URL, mirroring real modal entries.
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/" },
          { pathname: "/", state: { __oboku_modal: "#modal-ghost" } },
        ]}
        initialIndex={1}
      >
        <ModalHistoryProvider>
          <Probe />
        </ModalHistoryProvider>
      </MemoryRouter>,
    )

    // The provider recognises the ghost and pops it, landing on the real base
    // entry. Had it done nothing the "#modal-ghost" token would still be current.
    await waitFor(() => expect(modalToken()).toBeUndefined())
    expect(currentLocation.pathname).toBe("/")
  })

  it("pops a ghost exactly once under StrictMode (no jump past the page beneath)", async () => {
    // Regression: StrictMode double-invokes mount effects. An unguarded
    // navigate(-1) fired twice, skipping two entries — e.g. reader + modal →
    // reader → home. The ghost must be popped once, landing on the page
    // directly beneath the modal.
    render(
      <StrictMode>
        <MemoryRouter
          initialEntries={[
            { pathname: "/" },
            { pathname: "/reader/book-1" },
            {
              pathname: "/reader/book-1",
              state: { __oboku_modal: "#modal-ghost" },
            },
          ]}
          initialIndex={2}
        >
          <ModalHistoryProvider>
            <Probe />
          </ModalHistoryProvider>
        </MemoryRouter>
      </StrictMode>,
    )

    await waitFor(() => expect(modalToken()).toBeUndefined())
    // Lands on the reader, NOT all the way back on home.
    expect(currentLocation.pathname).toBe("/reader/book-1")
  })

  it("leaves a live modal entry (backed by a mounted overlay) alone", async () => {
    let setOpen!: (value: boolean) => void

    const Host = () => {
      const [open, setOpenState] = useState(false)
      setOpen = setOpenState
      useDismissibleOverlay({ open, onClose: () => setOpenState(false) })
      return null
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <ModalHistoryProvider>
          <Probe />
          <Host />
        </ModalHistoryProvider>
      </MemoryRouter>,
    )

    act(() => setOpen(true))

    await waitFor(() => expect(modalToken()).toBeTruthy())
    // Give the provider a chance to (wrongly) pop the live entry.
    await waitFor(() => expect(modalToken()).toBeTruthy())
    expect(modalToken()).toBeTruthy()
  })
})
