import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { type ReactNode, useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CancelError } from "../../../../errors/errors.shared"
import { type OneDrivePickerSelection, PickerFrame } from "./PickerFrame"

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

function pickUntilAborted({ signal }: { signal: AbortSignal }) {
  return new Promise(function rejectAsCancelledOnAbort(_resolve, reject) {
    signal.addEventListener("abort", function rejectAsCancelled() {
      reject(new CancelError())
    })
  })
}

function renderPickerFrameUntilClosed() {
  const onClose = vi.fn(function recordClose(
    _selections?: ReadonlyArray<OneDrivePickerSelection>,
  ) {})
  const onMutationSettled = vi.fn()
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onSettled: onMutationSettled }),
  })

  function PickerFrameUntilClosed() {
    const [isOpen, setIsOpen] = useState(true)

    if (!isOpen) return null

    return (
      <PickerFrame
        initialPickerAccessToken="token"
        onClose={function closePicker(selections) {
          setIsOpen(false)
          onClose(selections)
        }}
        pickerBaseUrl="https://onedrive.example"
      />
    )
  }

  render(
    <QueryClientProvider client={queryClient}>
      <PickerFrameUntilClosed />
    </QueryClientProvider>,
  )

  return { onClose, onMutationSettled }
}

describe("PickerFrame", () => {
  afterEach(function cleanUpPickerFrame() {
    cleanup()
    vi.clearAllMocks()
  })

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

  it("closes once, without selection, when the user closes the picker", async () => {
    pickOneDriveItemsWithPicker.mockImplementation(pickUntilAborted)
    const { onClose, onMutationSettled } = renderPickerFrameUntilClosed()

    await waitFor(function waitForPickerToStart() {
      expect(pickOneDriveItemsWithPicker).toHaveBeenCalled()
    })
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(function waitForAbortedPickerToSettle() {
      expect(onMutationSettled).toHaveBeenCalled()
    })

    expect(onClose).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it.each([
    { reason: "the user cancels inside the picker", error: new CancelError() },
    { reason: "the picker fails", error: new Error("Picker failed") },
  ])("closes once, without selection, when $reason", async ({ error }) => {
    pickOneDriveItemsWithPicker.mockRejectedValue(error)
    const { onClose } = renderPickerFrameUntilClosed()

    await waitFor(function waitForPickerToClose() {
      expect(onClose).toHaveBeenCalled()
    })

    expect(onClose).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it("closes once with the picked selections", async () => {
    const selection: OneDrivePickerSelection = {
      id: "file-id",
      name: "book.epub",
      parentReference: { driveId: "drive-id" },
    }
    pickOneDriveItemsWithPicker.mockResolvedValue([selection])
    const { onClose } = renderPickerFrameUntilClosed()

    await waitFor(function waitForPickerToClose() {
      expect(onClose).toHaveBeenCalled()
    })

    expect(onClose).toHaveBeenCalledExactlyOnceWith([selection])
  })
})
