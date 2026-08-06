// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookOptimizeActionsMenu } from "./BookOptimizeActionsMenu"

const mocks = vi.hoisted(function createMocks() {
  return {
    exportBookFileToDevice: vi.fn(),
    useExportBookFileToDevice: vi.fn(),
    useIsApplyingLocally: vi.fn(),
  }
})

vi.mock("../apply/useApplyLocally", function mockApplyLocally() {
  return { useIsApplyingLocally: mocks.useIsApplyingLocally }
})

vi.mock(
  "../../../download/useExportBookFileToDevice",
  function mockExportBookFileToDevice() {
    return { useExportBookFileToDevice: mocks.useExportBookFileToDevice }
  },
)

const renderActionsMenu = ({
  isApplyingLocally = false,
  isExportingToDevice = false,
} = {}) => {
  mocks.useIsApplyingLocally.mockReturnValue(isApplyingLocally)
  mocks.useExportBookFileToDevice.mockReturnValue({
    exportBookFileToDevice: mocks.exportBookFileToDevice,
    isExportingToDevice,
  })

  render(<BookOptimizeActionsMenu bookId="book-id" />)

  fireEvent.click(screen.getByRole("button", { name: "More actions" }))

  return screen.getByRole("menuitem", { name: "Download to device" })
}

describe("BookOptimizeActionsMenu", function testBookOptimizeActionsMenu() {
  afterEach(function cleanUpActionsMenu() {
    cleanup()
    vi.clearAllMocks()
  })

  it("downloads the local book file to the device", function downloadLocalFile() {
    const menuItem = renderActionsMenu()

    fireEvent.click(menuItem)

    expect(mocks.useExportBookFileToDevice).toHaveBeenCalledWith("book-id")
    expect(mocks.exportBookFileToDevice).toHaveBeenCalledOnce()
  })

  it("is disabled while local optimizations are applying", function disableWhileApplyingLocally() {
    const menuItem = renderActionsMenu({ isApplyingLocally: true })

    expect(menuItem.getAttribute("aria-disabled")).toBe("true")
    expect(mocks.useIsApplyingLocally).toHaveBeenCalledWith("book-id")
  })

  it("is disabled while a download is already running", function disableWhileDownloading() {
    const menuItem = renderActionsMenu({ isExportingToDevice: true })

    expect(menuItem.getAttribute("aria-disabled")).toBe("true")
  })
})
