import { afterEach, describe, expect, it, vi } from "vitest"
import { CancelError } from "../../errors/errors.shared"
import { createDialog } from "./createDialog"
import { dialogSignal } from "./state"

const getOnlyTemplateDialog = () => {
  const dialogs = dialogSignal.getValue()
  expect(dialogs).toHaveLength(1)

  const dialog = dialogs[0]
  if (!dialog) {
    throw new Error("Expected a queued dialog")
  }

  if (dialog.type === "custom") {
    throw new Error("Expected a template dialog")
  }

  return dialog
}

describe("createDialog", () => {
  afterEach(() => {
    dialogSignal.setValue([])
  })

  it("queues a template dialog and resolves with the action result", async () => {
    const onAction = vi.fn(() => "confirmed")
    const dialog = createDialog<string>({
      title: "Confirm",
      message: "Are you sure?",
      actions: [{ title: "Confirm", onAction }],
    })

    const queuedDialog = getOnlyTemplateDialog()

    expect(queuedDialog).toMatchObject({
      id: dialog.id,
      type: "template",
      title: "Confirm",
      message: "Are you sure?",
    })
    const action = queuedDialog.actions?.[0]
    if (!action) {
      throw new Error("Expected a dialog action")
    }

    expect(action.onAction()).toBe("confirmed")

    await expect(dialog.promise).resolves.toBe("confirmed")
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("resolves with null when using the default action", async () => {
    const dialog = createDialog({ title: "Notice" })
    const queuedDialog = getOnlyTemplateDialog()
    const action = queuedDialog.actions?.[0]
    if (!action) {
      throw new Error("Expected a dialog action")
    }

    expect(action.onAction()).toBeNull()

    await expect(dialog.promise).resolves.toBeNull()
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("wraps action callbacks with the dialog settlement behavior", async () => {
    const onAction = vi.fn(() => "archived")
    const dialog = createDialog<string>({
      actions: [
        {
          title: "Archive",
          onAction,
        },
      ],
    })

    const queuedDialog = getOnlyTemplateDialog()
    const action = queuedDialog.actions?.[0]
    if (!action) {
      throw new Error("Expected a dialog action")
    }

    expect(action.onAction()).toBe("archived")

    await expect(dialog.promise).resolves.toBe("archived")
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("rejects with CancelError when the queued dialog is cancelled", async () => {
    const onCancel = vi.fn()
    const dialog = createDialog({ onCancel })
    const queuedDialog = getOnlyTemplateDialog()
    const cancel = queuedDialog.onCancel
    if (!cancel) {
      throw new Error("Expected a cancel handler")
    }
    const rejection = expect(dialog.promise).rejects.toBeInstanceOf(CancelError)

    cancel()

    await rejection
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(dialogSignal.getValue()).toEqual([])
  })

  it("lets callers close the dialog externally", async () => {
    const onCancel = vi.fn()
    const dialog = createDialog({ onCancel })
    const rejection = expect(dialog.promise).rejects.toBeInstanceOf(CancelError)

    dialog.close()
    dialog.close()

    await rejection
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(dialogSignal.getValue()).toEqual([])
  })
})
