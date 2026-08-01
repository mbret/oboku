// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from "@testing-library/react"
import { BrowserRouter, useLocation, useNavigate } from "react-router"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { ROUTES } from "./routes"
import { useSafeGoBack } from "./useSafeGoBack"

/**
 * `useSafeGoBack` reasons about the real `window.history` stack, so these tests
 * drive a `BrowserRouter` (a `MemoryRouter` never touches `window.history`).
 * jsdom keeps one history stack per file, so each test starts by wiping the
 * current entry's state, which makes the router re-seed it at index 0 — the
 * same situation as opening a deep link in a fresh tab.
 */

const BOOK_OPTIMIZE_PATH = "/books/book-1/optimize"

let latestGoBack: (defaultTo?: string) => void
let latestNavigate: ReturnType<typeof useNavigate>
let currentLocation: ReturnType<typeof useLocation>

const Probe = () => {
  currentLocation = useLocation()
  latestNavigate = useNavigate()
  latestGoBack = useSafeGoBack().goBack

  return null
}

const renderAt = (url: string) => {
  window.history.replaceState(null, "", url)

  render(
    <BrowserRouter>
      <Probe />
    </BrowserRouter>,
  )
}

const currentUrl = () =>
  `${currentLocation.pathname}${currentLocation.search}${currentLocation.hash}`

beforeEach(() => {
  window.history.replaceState(null, "", "/")
})

afterEach(() => {
  cleanup()
})

describe("useSafeGoBack", () => {
  describe("with no entry to pop (deep link opened directly)", () => {
    it("falls back to home", async () => {
      renderAt(`${BOOK_OPTIMIZE_PATH}?tab=content`)

      act(() => latestGoBack())

      await waitFor(() => expect(currentUrl()).toBe(ROUTES.HOME))
    })

    it("falls back to the provided default", async () => {
      renderAt(`${BOOK_OPTIMIZE_PATH}?tab=content`)

      act(() => latestGoBack("/books/book-1"))

      await waitFor(() => expect(currentUrl()).toBe("/books/book-1"))
    })

    it("replaces the entry instead of pushing one", async () => {
      renderAt(`${BOOK_OPTIMIZE_PATH}?tab=content`)
      const lengthBeforeFallback = window.history.length

      act(() => latestGoBack())

      await waitFor(() => expect(currentUrl()).toBe(ROUTES.HOME))
      expect(window.history.length).toBe(lengthBeforeFallback)
    })
  })

  describe("with a pushed entry", () => {
    it("pops back to it", async () => {
      renderAt("/books/book-1")

      act(() => latestNavigate(`${BOOK_OPTIMIZE_PATH}?tab=content`))
      await waitFor(() =>
        expect(currentUrl()).toBe(`${BOOK_OPTIMIZE_PATH}?tab=content`),
      )

      act(() => latestGoBack())

      await waitFor(() => expect(currentUrl()).toBe("/books/book-1"))
    })

    it("still pops back to it after a replace-only navigation", async () => {
      // Regression: switching tab replaces the entry with `setSearchParams(…,
      // { replace: true })`. react-router rebuilds the whole history state on
      // replace, which used to wipe the flag this hook relied on, so back
      // wrongly fell through to home.
      renderAt("/books/book-1")

      act(() => latestNavigate(`${BOOK_OPTIMIZE_PATH}?tab=content`))
      await waitFor(() =>
        expect(currentUrl()).toBe(`${BOOK_OPTIMIZE_PATH}?tab=content`),
      )

      act(() =>
        latestNavigate(`${BOOK_OPTIMIZE_PATH}?tab=metadata`, { replace: true }),
      )
      await waitFor(() =>
        expect(currentUrl()).toBe(`${BOOK_OPTIMIZE_PATH}?tab=metadata`),
      )

      act(() => latestGoBack())

      await waitFor(() => expect(currentUrl()).toBe("/books/book-1"))
    })

    it("ignores the provided default", async () => {
      renderAt("/books/book-1")

      act(() => latestNavigate(`${BOOK_OPTIMIZE_PATH}?tab=content`))
      await waitFor(() =>
        expect(currentUrl()).toBe(`${BOOK_OPTIMIZE_PATH}?tab=content`),
      )

      act(() => latestGoBack(ROUTES.PROFILE))

      await waitFor(() => expect(currentUrl()).toBe("/books/book-1"))
    })
  })
})
