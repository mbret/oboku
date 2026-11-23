import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { PickerFrame } from "./PickerFrame"

const { pickOneDriveItemsWithPicker } = vi.hoisted(
  function createPickerMocks() {
    return { pickOneDriveItemsWithPicker: vi.fn() }
  },
)

vi.mock("./picker", function mockPicker() {
  return { pickOneDriveItemsWithPicker }
})

function getPickerIframeName() {
  return screen.getByTitle("OneDrive picker").getAttribute("name")
}

describe("PickerFrame", () => {
  it("keeps its iframe name across renders", () => {
    pickOneDriveItemsWithPicker.mockResolvedValue([])
    const queryClient = new QueryClient()

    function QueryClientWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { rerender } = render(
      <PickerFrame
        initialPickerAccessToken="token"
        onClose={vi.fn()}
        pickerBaseUrl="https://onedrive.example"
      />,
      { wrapper: QueryClientWrapper },
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
})
