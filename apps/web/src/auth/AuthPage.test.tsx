import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AuthPage } from "./AuthPage"

describe("AuthPage", () => {
  afterEach(cleanup)

  it("shows the app version", () => {
    render(<AuthPage>form</AuthPage>)

    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeVisible()
  })
})
