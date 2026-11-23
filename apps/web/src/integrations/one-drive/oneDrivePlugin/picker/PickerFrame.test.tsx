import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PickerFrame } from "./PickerFrame"

const { pickOneDriveItemsWithPicker } = vi.hoisted(
  function createPickerMocks() {
    return { pickOneDriveItemsWithPicker: vi.fn() }
  },
)

vi.mock("./picker", function mockPicker() {
  return { pickOneDriveItemsWithPicker }
})

afterEach(cleanup)

function createQueryClientWrapper() {
  const queryClient = new QueryClient()

  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function getPickerIframeName() {
  return screen.getByTitle("OneDrive picker").getAttribute("name")
}

describe("PickerFrame", () => {
  it("keeps its iframe name across renders", () => {
    pickOneDriveItemsWithPicker.mockResolvedValue([])

    const { rerender } = render(
      <PickerFrame
        initialPickerAccessToken="token"
        onClose={vi.fn()}
        pickerBaseUrl="https://onedrive.example"
      />,
      { wrapper: createQueryClientWrapper() },
    )
    const firstIframeName = getPickerIframeName()

    rerender(
      <PickerFrame
        initialPickerAccessToken="token"
        onClose={vi.fn()}
        pickerBaseUrl="https://onedrive.example"
        selectionMode="folders"
      />,
    )

    expect(firstIframeName).toMatch(/^one-drive-picker-/)
    expect(getPickerIframeName()).toBe(firstIframeName)
  })

  it("closes without a selection from its Close button", () => {
    pickOneDriveItemsWithPicker.mockReturnValue(
      Promise.withResolvers<never>().promise,
    )
    const onClose = vi.fn()

    render(
      <PickerFrame
        initialPickerAccessToken="token"
        onClose={onClose}
        pickerBaseUrl="https://onedrive.example"
      />,
      { wrapper: createQueryClientWrapper() },
    )
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(onClose).toHaveBeenCalledExactlyOnceWith()
  })
})
