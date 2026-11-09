import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it } from "vitest"
import { ROUTES } from "../../navigation/routes"
import { OpdsIntegrationScreen } from "./OpdsIntegrationScreen"

describe("OpdsIntegrationScreen", () => {
  afterEach(() => {
    cleanup()
  })

  it("links to the OPDS servers oboku serves and the OPDS catalogs it syncs from", () => {
    render(
      <MemoryRouter>
        <OpdsIntegrationScreen />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("link", { name: /^OPDS servers/ }).getAttribute("href"),
    ).toBe(ROUTES.OPDS_SERVERS)
    expect(
      screen.getByRole("link", { name: /^OPDS catalogs/ }).getAttribute("href"),
    ).toBe(ROUTES.OPDS_CATALOGS)
  })
})
