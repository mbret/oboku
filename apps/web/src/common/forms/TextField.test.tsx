import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { toastsSubject } from "../../notifications/toasts"
import { TextField } from "./TextField"

const CATALOG_URL = "https://api.oboku.test/opds/calm-snails-dream"

describe("TextField", () => {
  afterEach(cleanup)

  describe("when copyable", () => {
    it("copies its value to the clipboard, then says so", async () => {
      const onToast = vi.fn()
      const toastSubscription = toastsSubject.subscribe(onToast)
      onTestFinished(function stopObservingToasts() {
        toastSubscription.unsubscribe()
      })
      render(
        <>
          <TextField label="Catalog URL" value={CATALOG_URL} copyable />
          <input aria-label="Reading app" />
        </>,
      )

      await userEvent.click(
        screen.getByRole("button", { name: "Copy Catalog URL" }),
      )

      await vi.waitFor(() =>
        expect(onToast).toHaveBeenCalledWith({
          title: "Copied",
          description: "Catalog URL copied to the clipboard",
          severity: "success",
        }),
      )
      const readingAppInput = screen.getByRole("textbox", {
        name: "Reading app",
      })
      await userEvent.click(readingAppInput)
      await userEvent.paste()
      expect(readingAppInput).toHaveProperty("value", CATALOG_URL)
    })

    it("keeps the input slot props it is given", () => {
      render(
        <TextField
          label="Catalog URL"
          value={CATALOG_URL}
          copyable
          slotProps={{ input: { readOnly: true } }}
        />,
      )

      expect(
        screen
          .getByRole("textbox", { name: "Catalog URL" })
          .hasAttribute("readonly"),
      ).toBe(true)
      expect(
        screen.getByRole("button", { name: "Copy Catalog URL" }),
      ).toBeTruthy()
    })
  })

  it("has no copy button unless copyable", () => {
    render(<TextField label="Catalog URL" value={CATALOG_URL} />)

    expect(screen.queryByRole("button")).toBeNull()
  })
})
