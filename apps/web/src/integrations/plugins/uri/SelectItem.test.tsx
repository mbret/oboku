import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { SelectItem } from "./SelectItem"

const BOOK_URL = "https://nas.example.com/file/45646578"

const renderSelectItem = (open: boolean) => {
  const onClose = vi.fn()

  render(
    <SelectItem
      open={open}
      currentLinkData={{ url: BOOK_URL }}
      requestPopup={vi.fn()}
      onClose={onClose}
    />,
  )

  return { onClose }
}

describe("SelectItem (web address)", () => {
  afterEach(cleanup)

  it("shows nothing until it opens", () => {
    renderSelectItem(false)

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("starts from the book file's address, and gives back the data the user confirms", async () => {
    const { onClose } = renderSelectItem(true)

    await expect
      .element(screen.getByLabelText("Your file url"))
      .toHaveValue(BOOK_URL)
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Use oboku's server as a proxy" }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    expect(onClose.mock.calls).toEqual([
      [undefined, { data: { url: BOOK_URL, proxyThroughServer: true } }],
    ])
  })

  it("keeps the book file when the user cancels", async () => {
    const { onClose } = renderSelectItem(true)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose.mock.calls).toEqual([[]])
  })
})
