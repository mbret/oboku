import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { SourceType } from "@oboku/shared"
import { MemoryRouter, useLocation } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createSendBookToKindleRowMocks() {
  return { useSettings: vi.fn(), sendBookToKindle: vi.fn() }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
})

vi.mock("./useSendBookToKindle", function mockSendBookToKindle() {
  return {
    useSendBookToKindle: function useMockSendBookToKindle() {
      return { mutate: mocks.sendBookToKindle }
    },
  }
})

import { activateLocale } from "../../i18n/activateLocale"
import { ROUTES } from "../../navigation/routes"
import { SendBookToKindleListItemButton } from "./SendBookToKindleListItemButton"

const BOOK_ID = "book-dune"
const LIBRARY_PATH = "/library/books"

function CurrentPath() {
  return <output>{useLocation().pathname}</output>
}

const renderRow = ({
  linkType,
  kindleEmail,
}: {
  linkType: SourceType | undefined
  kindleEmail?: string
}) => {
  const closeList = vi.fn(function closeThenRun(afterClose?: () => void) {
    afterClose?.()
  })
  mocks.useSettings.mockReturnValue({ data: { _id: "settings", kindleEmail } })

  render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={[LIBRARY_PATH]}>
        <SendBookToKindleListItemButton
          bookId={BOOK_ID}
          linkType={linkType}
          onClose={closeList}
        />
        <CurrentPath />
      </MemoryRouter>
    </I18nProvider>,
  )

  return { closeList, row: screen.getByRole("button") }
}

describe("SendBookToKindleListItemButton", () => {
  beforeEach(async () => {
    await activateLocale("en")
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("closes its list and sends the book when a Kindle address is saved", () => {
    const { closeList, row } = renderRow({
      linkType: "DRIVE",
      kindleEmail: "reader@kindle.com",
    })

    fireEvent.click(row)

    expect(closeList).toHaveBeenCalledTimes(1)
    expect(mocks.sendBookToKindle).toHaveBeenCalledWith({ bookId: BOOK_ID })
    expect(screen.getByRole("status").textContent).toBe(LIBRARY_PATH)
  })

  it("opens the setup screen, and sends nothing, while no Kindle address is saved", () => {
    const { closeList, row } = renderRow({ linkType: "DRIVE" })

    fireEvent.click(row)

    expect(closeList).toHaveBeenCalledTimes(1)
    expect(mocks.sendBookToKindle).not.toHaveBeenCalled()
    expect(screen.getByRole("status").textContent).toBe(ROUTES.SEND_TO_KINDLE)
  })

  it("is off for a book added from the device, and says why", () => {
    const { row } = renderRow({
      linkType: "file",
      kindleEmail: "reader@kindle.com",
    })

    expect(row.getAttribute("aria-disabled")).toBe("true")
    expect(row.textContent).toBe(
      "Send to KindleA book added from this device cannot be sent",
    )
  })

  it("is off while the book has no file", () => {
    const { row } = renderRow({
      linkType: undefined,
      kindleEmail: "reader@kindle.com",
    })

    expect(row.getAttribute("aria-disabled")).toBe("true")
    expect(row.textContent).toBe("Send to Kindle")
  })
})
