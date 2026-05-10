import { afterEach, describe, expect, it } from "vitest"
import { CancelError } from "../../errors/errors.shared"
import {
  type CustomDialogControls,
  createCustomDialog,
} from "./createCustomDialog"
import { dialogSignal } from "./state"

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

describe("createCustomDialog", () => {
  afterEach(() => {
    dialogSignal.setValue([])
  })

  it("queues a custom dialog and resolves through render controls", async () => {
    let controls: CustomDialogControls<string> | undefined
    const dialog = createCustomDialog<string>({
      render: (renderControls) => {
        controls = renderControls

        return "Custom dialog"
      },
    })

    const queuedDialog = getOnlyCustomDialog()

    expect(queuedDialog.id).toBe(dialog.id)
    expect(queuedDialog.render()).toBe("Custom dialog")
    if (!controls) {
      throw new Error("Expected render controls")
    }

    controls.confirm("accepted")

    await expect(dialog.promise).resolves.toBe("accepted")
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("rejects with CancelError through render controls", async () => {
    let controls: CustomDialogControls<string> | undefined
    const dialog = createCustomDialog<string>({
      render: (renderControls) => {
        controls = renderControls

        return "Custom dialog"
      },
    })

    const queuedDialog = getOnlyCustomDialog()
    const rejection = expect(dialog.promise).rejects.toBeInstanceOf(CancelError)

    queuedDialog.render()
    if (!controls) {
      throw new Error("Expected render controls")
    }

    controls.cancel()

    await rejection
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("lets callers close the dialog externally", async () => {
    const dialog = createCustomDialog({
      render: () => "Custom dialog",
    })
    const rejection = expect(dialog.promise).rejects.toBeInstanceOf(CancelError)

    dialog.close()
    dialog.close()

    await rejection
    expect(dialogSignal.getValue()).toEqual([])
  })
})
