// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createCustomDialog } from "./createCustomDialog"
import { createDialog } from "./createDialog"
import { DialogProvider } from "./DialogProvider"
import { createConfirmDialogOptions } from "./presets"
import { dialogSignal } from "./state"

const renderDialogProvider = () => {
  render(
    <DialogProvider>
      <div>Application content</div>
    </DialogProvider>,
  )
}

describe("DialogProvider", () => {
  beforeEach(() => {
    dialogSignal.setValue([])
  })

  afterEach(() => {
    cleanup()
    dialogSignal.setValue([])
  })

  it("renders template dialogs created programmatically", async () => {
    renderDialogProvider()

    let dialog: ReturnType<typeof createDialog<string>> | undefined
    act(() => {
      dialog = createDialog<string>({
        title: "Remove books",
        message: "This cannot be undone.",
        actions: [{ title: "Remove", onAction: () => "removed" }],
      })
    })
    if (!dialog) {
      throw new Error("Expected a dialog handle")
    }

    expect(await screen.findByRole("dialog")).not.toBeNull()
    expect(screen.getByText("Remove books")).not.toBeNull()
    expect(screen.getByText("This cannot be undone.")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Remove" }))

    await expect(dialog.promise).resolves.toBe("removed")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
  })

  it("renders confirm preset actions with the safe action emphasized", async () => {
    renderDialogProvider()

    act(() => {
      createDialog(
        createConfirmDialogOptions({ actions: [{ title: "Overwrite" }] }),
      )
    })

    expect(await screen.findByRole("dialog")).not.toBeNull()

    const cancelButton = screen.getByRole("button", { name: "Cancel" })
    const actionButton = screen.getByRole("button", { name: "Overwrite" })

    expect(cancelButton.className).toContain("MuiButton-contained")
    expect(actionButton.className).toContain("MuiButton-outlined")
  })

  it("renders custom dialogs created programmatically", async () => {
    renderDialogProvider()

    let dialog: ReturnType<typeof createCustomDialog<string>> | undefined
    act(() => {
      dialog = createCustomDialog<string>({
        render: ({ confirm }) => (
          <div aria-label="Custom flow" role="dialog">
            <p>Custom dialog body</p>
            <button type="button" onClick={() => confirm("accepted")}>
              Accept
            </button>
          </div>
        ),
      })
    })
    if (!dialog) {
      throw new Error("Expected a dialog handle")
    }

    expect(
      await screen.findByRole("dialog", { name: "Custom flow" }),
    ).not.toBeNull()
    expect(screen.getByText("Custom dialog body")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Accept" }))

    await expect(dialog.promise).resolves.toBe("accepted")
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Custom flow" })).toBeNull()
    })
  })
})
