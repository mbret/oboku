// @vitest-environment jsdom

import type { WebArchiveUpdateAction } from "@oboku/archive-metadata/web"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { DialogProvider } from "../../../common/dialogs/DialogProvider"
import { dialogSignal } from "../../../common/dialogs/state"
import { confirmApplyLocalUpdate } from "./confirmApplyLocalUpdate"

function renderDialogProvider() {
  render(
    <DialogProvider>
      <div>Application content</div>
    </DialogProvider>,
  )
}

function openConfirmation(actions: WebArchiveUpdateAction[]): Promise<boolean> {
  let confirmation: Promise<boolean> | undefined

  act(function showApplyConfirmation() {
    confirmation = confirmApplyLocalUpdate(actions)
  })

  if (!confirmation) {
    throw new Error("Expected an apply confirmation")
  }

  return confirmation
}

describe("confirmApplyLocalUpdate", function testConfirmApplyLocalUpdate() {
  beforeEach(function resetDialogs() {
    dialogSignal.setValue([])
  })

  afterEach(function cleanUpDialogs() {
    cleanup()
    dialogSignal.setValue([])
  })

  it("lists every update and the final file replacement", async function listUpdates() {
    const actions: WebArchiveUpdateAction[] = [
      {
        kind: "patch-metadata",
        patch: { isbn: "9781234567897" },
        targets: { comicInfo: true, opf: true },
      },
      {
        kind: "compress-images",
        config: { maxWidth: 1200, maxHeight: 1600, outputMode: "webp" },
      },
    ]
    renderDialogProvider()

    const confirmation = openConfirmation(actions)

    expect(await screen.findByRole("dialog")).not.toBeNull()
    expect(screen.getByText("Before updating the book...")).not.toBeNull()
    expect(screen.getByRole("heading", { name: "Book updates" })).not.toBeNull()
    expect(
      screen.getByRole("heading", { name: "Downloaded file" }),
    ).not.toBeNull()
    const listItems = screen.getAllByRole("listitem")

    expect(listItems).toHaveLength(5)
    expect(listItems[0]?.textContent).toContain("Set the ISBN to")
    expect(screen.getByText("9781234567897")).not.toBeNull()
    expect(screen.getByText("ComicInfo.xml")).not.toBeNull()
    expect(screen.getByText("OPF package document")).not.toBeNull()
    expect(listItems[1]?.textContent).toContain("Resize eligible")
    expect(screen.getByText("1200 × 1600 px")).not.toBeNull()
    expect(screen.getAllByText("JPG · JPEG · PNG · BMP")).toHaveLength(2)
    expect(listItems[2]?.textContent).toContain(
      "Convert JPG · JPEG · PNG · BMP images to WebP",
    )
    expect(screen.getByText("WebP")).not.toBeNull()
    expect(listItems[3]?.textContent).toBe(
      "Update references to converted images.",
    )
    expect(
      screen.getByText(
        "Replace the downloaded file on this device with the result.",
      ),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Update book" }))

    await expect(confirmation).resolves.toBe(true)
  })

  it("describes removing metadata and a single resize constraint", async function listRemovalAndResize() {
    const actions: WebArchiveUpdateAction[] = [
      {
        kind: "patch-metadata",
        patch: { isbn: undefined },
        targets: { comicInfo: true },
      },
      {
        kind: "compress-images",
        config: {
          maxWidth: undefined,
          maxHeight: 1600,
          outputMode: "original",
        },
      },
    ]
    renderDialogProvider()

    const confirmation = openConfirmation(actions)

    expect(await screen.findByRole("dialog")).not.toBeNull()
    const listItems = screen.getAllByRole("listitem")

    expect(listItems).toHaveLength(5)
    expect(listItems[0]?.textContent).toContain("Remove the ISBN from")
    expect(screen.getByText("ComicInfo.xml")).not.toBeNull()
    expect(listItems[1]?.textContent).toContain("to a maximum height of")
    expect(screen.getByText("1600 px")).not.toBeNull()
    expect(screen.getByText("JPG · JPEG · PNG")).not.toBeNull()
    expect(listItems[2]?.textContent).toContain(
      "Keep each resized image in its original format",
    )
    expect(listItems[3]?.textContent).toContain(
      "Leave all other image formats unchanged",
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await expect(confirmation).resolves.toBe(false)
  })

  it("describes AVIF conversion", async function describeAvifConversion() {
    const actions: WebArchiveUpdateAction[] = [
      {
        kind: "compress-images",
        config: {
          maxWidth: undefined,
          maxHeight: undefined,
          outputMode: "avif",
        },
      },
    ]
    renderDialogProvider()

    const confirmation = openConfirmation(actions)

    expect(await screen.findByRole("dialog")).not.toBeNull()
    const listItems = screen.getAllByRole("listitem")

    expect(listItems[0]?.textContent).toContain(
      "Convert JPG · JPEG · PNG · BMP images to AVIF",
    )
    expect(screen.getByText("AVIF")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await expect(confirmation).resolves.toBe(false)
  })
})
