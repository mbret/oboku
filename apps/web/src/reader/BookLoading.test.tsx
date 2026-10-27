import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../navigation/routes"
import { type BookOpening, BookLoading } from "./BookLoading"

const READER_PATH = "/reader/book-1"
const SLOW_CHECK_THRESHOLD_MS = 3000

const advanceBy = async (ms: number) => {
  await act(async function advanceFakeTime() {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const renderBookLoading = (opening: BookOpening) =>
  render(
    <MemoryRouter initialEntries={[READER_PATH]}>
      <Routes>
        <Route path={READER_PATH} element={<BookLoading opening={opening} />} />
        <Route
          path={ROUTES.KOREADER_PROGRESS_SYNC}
          element={<p>KOReader progress sync</p>}
        />
      </Routes>
    </MemoryRouter>,
  )

describe("BookLoading", () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it.each<BookOpening>([
    { status: "loadingFile" },
    { status: "starting" },
    { status: "done" },
  ])(
    "shows the book loading, without a KOReader step, when the opening is $status",
    (opening) => {
      renderBookLoading(opening)

      expect(screen.getByText("Your book is loading...")).toBeDefined()
      expect(screen.queryByText(/KOReader/)).toBeNull()
      expect(
        screen.queryByRole("button", { name: "Continue anyway" }),
      ).toBeNull()
    },
  )

  it("lets the user continue once the KOReader position takes a while to check", async () => {
    vi.useFakeTimers()
    const continueAnyway = vi.fn()
    renderBookLoading({ status: "checking", continueAnyway })

    expect(screen.getByText("Checking your KOReader position...")).toBeDefined()

    await advanceBy(SLOW_CHECK_THRESHOLD_MS - 1)

    expect(screen.queryByRole("button", { name: "Continue anyway" })).toBeNull()

    await advanceBy(1)
    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }))

    expect(continueAnyway).toHaveBeenCalledOnce()
  })

  it("lets the user try again or continue when the check failed", () => {
    const tryAgain = vi.fn()
    const continueAnyway = vi.fn()
    renderBookLoading({ status: "failed", tryAgain, continueAnyway })

    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }))

    expect(tryAgain).toHaveBeenCalledOnce()
    expect(continueAnyway).toHaveBeenCalledOnce()
  })

  it("sends the user to sign in again when the server refused the password", () => {
    renderBookLoading({ status: "refused", continueAnyway: vi.fn() })

    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Sign in again" }))

    expect(screen.getByText("KOReader progress sync")).toBeDefined()
  })
})
