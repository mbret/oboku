import { afterEach, describe, expect, it } from "vitest"
import type { CustomDialogControls } from "./createCustomDialog"
import { dialogSignal } from "./state"
import { fromCreateCustomDialog } from "./fromCreateCustomDialog"

const getOnlyCustomDialog = () => {
  const dialogs = dialogSignal.getValue()
  expect(dialogs).toHaveLength(1)

  const dialog = dialogs[0]
  if (!dialog) {
    throw new Error("Expected a queued dialog")
  }

  if (dialog.type !== "custom") {
    throw new Error("Expected a custom dialog")
  }

  return dialog
}

describe("fromCreateCustomDialog", () => {
  afterEach(() => {
    dialogSignal.setValue([])
  })

  it("closes the custom dialog when unsubscribed by default", () => {
    const subscription = fromCreateCustomDialog({
      render: () => "Custom dialog",
    }).subscribe()

    getOnlyCustomDialog()

    subscription.unsubscribe()

    expect(dialogSignal.getValue()).toEqual([])
  })

  it("keeps the custom dialog open when fireAndForget is enabled", () => {
    let controls: CustomDialogControls<string> | undefined
    const subscription = fromCreateCustomDialog<string>({
      fireAndForget: true,
      render: (renderControls) => {
        controls = renderControls

        return "Custom dialog"
      },
    }).subscribe()

    const dialog = getOnlyCustomDialog()
    dialog.render()

    subscription.unsubscribe()

    expect(dialogSignal.getValue()).toEqual([dialog])
    if (!controls) {
      throw new Error("Expected render controls")
    }

    controls.confirm("accepted")

    expect(dialogSignal.getValue()).toEqual([])
  })
})
