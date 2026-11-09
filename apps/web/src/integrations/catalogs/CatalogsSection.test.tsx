import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createCatalogsSectionMocks() {
  return { useSettings: vi.fn(), setCatalogEnabled: vi.fn() }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
})

vi.mock("./useSetCatalogEnabled", function mockSetCatalogEnabled() {
  return {
    useSetCatalogEnabled: () => ({ mutate: mocks.setCatalogEnabled }),
  }
})

import { CatalogsSection } from "./CatalogsSection"

const switchOf = (name: string) => {
  const input = screen.getByLabelText(name)

  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No switch for ${name}`)
  }

  return input
}

describe("CatalogsSection", () => {
  afterEach(() => {
    cleanup()
    mocks.setCatalogEnabled.mockReset()
  })

  it("shows a catalog off only when the account turned it off", () => {
    mocks.useSettings.mockReturnValue({
      data: {
        _id: "settings",
        catalogs: [{ id: "openLibrary", isEnabled: false }],
      },
    })

    render(<CatalogsSection />)

    expect(switchOf("Open Library").checked).toBe(false)
    expect(switchOf("Google Books").checked).toBe(true)
    expect(switchOf("Project Gutenberg").checked).toBe(true)
  })

  it("turns a catalog off", () => {
    mocks.useSettings.mockReturnValue({ data: { _id: "settings" } })

    render(<CatalogsSection />)
    fireEvent.click(switchOf("Google Books"))

    expect(mocks.setCatalogEnabled).toHaveBeenCalledWith({
      id: "googleBooks",
      isEnabled: false,
    })
  })
})
