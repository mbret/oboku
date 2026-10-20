import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"
import { ROUTES } from "../navigation/routes"
import { BookLoading } from "./BookLoading"

const READER_PATH = "/reader/book-1"

const renderBookLoading = ({
  isBookLoaded = true,
  koreaderPositionCheck,
}: {
  isBookLoaded?: boolean
  koreaderPositionCheck: KoreaderPositionCheck
}) =>
  render(
    <MemoryRouter initialEntries={[READER_PATH]}>
      <Routes>
        <Route
          path={READER_PATH}
          element={
            <BookLoading
              isBookLoaded={isBookLoaded}
              koreaderPositionCheck={koreaderPositionCheck}
            />
          }
        />
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
  })

  it("shows the book loading until its file is loaded, whatever the KOReader check", () => {
    renderBookLoading({
      isBookLoaded: false,
      koreaderPositionCheck: { status: "checking", continueAnyway: vi.fn() },
    })

    expect(screen.getByText("Your book is loading...")).toBeDefined()
    expect(screen.queryByRole("button", { name: "Continue anyway" })).toBeNull()
  })

  it("lets the user continue while the KOReader position is checked", () => {
    const continueAnyway = vi.fn()
    renderBookLoading({
      koreaderPositionCheck: { status: "checking", continueAnyway },
    })

    expect(screen.getByText("Checking your KOReader position...")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }))

    expect(continueAnyway).toHaveBeenCalledOnce()
  })

  it("lets the user try again or continue when the check failed", () => {
    const tryAgain = vi.fn()
    const continueAnyway = vi.fn()
    renderBookLoading({
      koreaderPositionCheck: { status: "failed", tryAgain, continueAnyway },
    })

    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    fireEvent.click(screen.getByRole("button", { name: "Continue anyway" }))

    expect(tryAgain).toHaveBeenCalledOnce()
    expect(continueAnyway).toHaveBeenCalledOnce()
  })

  it("sends the user to sign in again when the server refused the password", () => {
    renderBookLoading({
      koreaderPositionCheck: { status: "refused", continueAnyway: vi.fn() },
    })

    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Sign in again" }))

    expect(screen.getByText("KOReader progress sync")).toBeDefined()
  })
})
