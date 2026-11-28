import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { WebAddressDialog } from "./WebAddressDialog"

const BOOK_URL = "https://nas.example.com/file/45646578"

describe("WebAddressDialog", () => {
  afterEach(cleanup)

  it("gives the address and the proxy setting the user picks", async () => {
    const onConfirm = vi.fn()
    render(
      <WebAddressDialog
        title="Add a book"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    await userEvent.fill(screen.getByLabelText("Your file url"), BOOK_URL)
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Use oboku's server as a proxy" }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    expect(onConfirm.mock.calls).toEqual([
      [{ url: BOOK_URL, proxyThroughServer: true }],
    ])
  })

  it("starts from the book file's current data, and drops a setting the user unchecks", async () => {
    const onConfirm = vi.fn()
    render(
      <WebAddressDialog
        title="Web address"
        initialLinkData={{
          url: BOOK_URL,
          allowSelfSigned: true,
          proxyThroughServer: true,
        }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    const proxyCheckbox = screen.getByRole("checkbox", {
      name: "Use oboku's server as a proxy",
    })

    await expect
      .element(screen.getByLabelText("Your file url"))
      .toHaveValue(BOOK_URL)
    await expect.element(proxyCheckbox).toBeChecked()
    await userEvent.click(proxyCheckbox)
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    expect(onConfirm.mock.calls).toEqual([
      [{ url: BOOK_URL, allowSelfSigned: true }],
    ])
  })

  it("refuses an address that is not http(s)", async () => {
    render(
      <WebAddressDialog
        title="Add a book"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await userEvent.fill(
      screen.getByLabelText("Your file url"),
      "ftp://nas.example.com/45646578.epub",
    )

    await expect
      .element(screen.getByRole("button", { name: "Confirm" }))
      .toBeDisabled()
  })
})
