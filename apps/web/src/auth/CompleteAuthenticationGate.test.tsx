// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { MutationStatus } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

const { useActiveProfile } = vi.hoisted(() => ({
  useActiveProfile: vi.fn(),
}))

vi.mock("../profiles", () => ({ useActiveProfile }))
vi.mock("./SignOutBeforeContinuePage", () => ({
  SignOutBeforeContinuePage: () => <div>sign out first</div>,
}))

import { ROUTES } from "../navigation/routes"
import { CompleteAuthenticationGate } from "./CompleteAuthenticationGate"

const renderGate = (completionStatus: MutationStatus) =>
  render(
    <MemoryRouter initialEntries={[ROUTES.SIGN_UP_COMPLETE]}>
      <Routes>
        <Route path={ROUTES.HOME} element={<div>home</div>} />
        <Route
          path={ROUTES.SIGN_UP_COMPLETE}
          element={
            <CompleteAuthenticationGate completionStatus={completionStatus}>
              <div>completion form</div>
            </CompleteAuthenticationGate>
          }
        />
      </Routes>
    </MemoryRouter>,
  )

describe("CompleteAuthenticationGate", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders the completion form when nobody is signed in", () => {
    useActiveProfile.mockReturnValue({ data: null })

    renderGate("idle")

    expect(screen.getByText("completion form")).toBeTruthy()
  })

  it("asks a user who was already signed in to sign out first", () => {
    useActiveProfile.mockReturnValue({ data: { id: "reader" } })

    renderGate("idle")

    expect(screen.getByText("sign out first")).toBeTruthy()
    expect(screen.queryByText("home")).toBeNull()
  })

  it.each<MutationStatus>(["pending", "success"])(
    "goes home when the %s completion it started signed the user in",
    (completionStatus) => {
      useActiveProfile.mockReturnValue({ data: { id: "reader" } })

      renderGate(completionStatus)

      expect(screen.getByText("home")).toBeTruthy()
      expect(screen.queryByText("sign out first")).toBeNull()
    },
  )
})
