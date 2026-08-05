// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TestBookButton } from "./TestBookButton"

const mocks = vi.hoisted(function createMocks() {
  return { useIsApplyingLocally: vi.fn() }
})

vi.mock("../apply/useApplyLocally", function mockApplyLocally() {
  return { useIsApplyingLocally: mocks.useIsApplyingLocally }
})

vi.mock("../../../reader/ReaderScreen", function mockReaderScreen() {
  return {
    READER_MODE_PARAM: "mode",
    READER_PREVIEW_MODE: "preview",
  }
})

const renderTestBookButton = (isApplyingLocally: boolean) => {
  mocks.useIsApplyingLocally.mockReturnValue(isApplyingLocally)

  render(
    <MemoryRouter>
      <TestBookButton bookId="book-id" />
    </MemoryRouter>,
  )

  return screen.getByRole("link", { name: "Test" })
}

describe("TestBookButton", function testTestBookButton() {
  afterEach(function cleanUpTestBookButton() {
    cleanup()
    vi.clearAllMocks()
  })

  it("is enabled while the book is idle", function enableWhileIdle() {
    const button = renderTestBookButton(false)

    expect(button.getAttribute("aria-disabled")).toBeNull()
  })

  it("is disabled while local optimizations are applying", function disableWhileApplyingLocally() {
    const button = renderTestBookButton(true)

    expect(button.getAttribute("aria-disabled")).toBe("true")
    expect(mocks.useIsApplyingLocally).toHaveBeenCalledWith("book-id")
  })
})
