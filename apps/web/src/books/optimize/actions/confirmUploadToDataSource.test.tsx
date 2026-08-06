// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { DialogProvider } from "../../../common/dialogs/DialogProvider"
import { dialogSignal } from "../../../common/dialogs/state"
import { confirmUploadToDataSource } from "./confirmUploadToDataSource"

function renderDialogProvider() {
  render(
    <DialogProvider>
      <div>Application content</div>
    </DialogProvider>,
  )
}

function openConfirmation(prunesVersionHistory: boolean): Promise<boolean> {
  let confirmation: Promise<boolean> | undefined

  act(function showUploadConfirmation() {
    confirmation = confirmUploadToDataSource({
      providerName: "Google Drive",
      prunesVersionHistory,
    })
  })

  if (!confirmation) {
    throw new Error("Expected an upload confirmation")
  }

  return confirmation
}

describe("confirmUploadToDataSource", function testConfirmUploadToDataSource() {
  beforeEach(function resetDialogs() {
    dialogSignal.setValue([])
  })

  afterEach(function cleanUpDialogs() {
    cleanup()
    dialogSignal.setValue([])
  })

  it("announces the version history replacement as a locked option", async function announceVersionHistoryPruning() {
    renderDialogProvider()

    const confirmation = openConfirmation(true)

    expect(await screen.findByRole("dialog")).not.toBeNull()
    expect(
      screen.getByText(
        "This will overwrite the file on the remote data source with the current local file.",
      ),
    ).not.toBeNull()

    const versionHistoryCheckbox = screen.getByRole("checkbox", {
      name: /Replace the version history/,
    })

    expect(versionHistoryCheckbox).toBeInstanceOf(HTMLInputElement)
    expect(versionHistoryCheckbox).toHaveProperty("checked", true)
    expect(versionHistoryCheckbox).toHaveProperty("disabled", true)
    expect(
      screen.getByText(/Google Drive keeps every previous version of a file/),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Ok" }))

    await expect(confirmation).resolves.toBe(true)
  })

  it("omits the option for providers that keep no version history", async function hideVersionHistoryOption() {
    renderDialogProvider()

    const confirmation = openConfirmation(false)

    expect(await screen.findByRole("dialog")).not.toBeNull()
    expect(screen.queryByRole("checkbox")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await expect(confirmation).resolves.toBe(false)
  })
})
