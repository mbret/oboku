import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createSendToKindleScreenMocks() {
  return {
    useConfig: vi.fn(),
    useSettings: vi.fn(),
    saveKindleEmail: vi.fn(),
    showConfirmDialog: vi.fn(),
  }
})

vi.mock("../../config/useConfig", async function mockConfig(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../../config/useConfig")>()),
    useConfig: mocks.useConfig,
  }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
})

vi.mock("./useSetKindleEmail", function mockSetKindleEmail() {
  return {
    useSetKindleEmail: function useMockSetKindleEmail() {
      return { mutate: mocks.saveKindleEmail, isPending: false }
    },
  }
})

vi.mock(
  "../../common/dialogs/presets",
  async function mockDialogs(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../common/dialogs/presets")
      >()),
      showConfirmDialog: mocks.showConfirmDialog,
    }
  },
)

import { activateLocale } from "../../i18n/activateLocale"
import { SendToKindleScreen } from "./SendToKindleScreen"

const SEND_TO_KINDLE = {
  senderAddress: "books@oboku.example",
  maxFileSizeBytes: 25_000_000,
  maxSendsPerDay: 10,
}

const renderScreen = ({
  config = { SEND_TO_KINDLE },
  kindleEmail,
}: {
  config?: { SEND_TO_KINDLE?: typeof SEND_TO_KINDLE }
  kindleEmail?: string | null
} = {}) => {
  mocks.useConfig.mockReturnValue({ data: config })
  mocks.useSettings.mockReturnValue({ data: { _id: "settings", kindleEmail } })

  render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter>
        <SendToKindleScreen />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const getAddressField = () =>
  screen.getByRole("textbox", { name: "Send to Kindle address" })

const getSaveButton = () => screen.getByRole("button", { name: "Save" })

const typeAddress = (address: string) =>
  fireEvent.change(getAddressField(), { target: { value: address } })

describe("SendToKindleScreen", () => {
  beforeEach(async () => {
    await activateLocale("en")
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("shows the address to approve at Amazon and the limits of the instance", () => {
    renderScreen()

    expect(
      screen
        .getByRole("textbox", { name: "Address to approve" })
        .getAttribute("value"),
    ).toBe(SEND_TO_KINDLE.senderAddress)
    expect(screen.getByText("Up to 25.0 MB for a book")).toBeTruthy()
    expect(screen.getByText("10 books a day")).toBeTruthy()
  })

  it("says the server cannot send emails, and shows no setup, on an instance without email delivery", () => {
    renderScreen({ config: {} })

    expect(
      screen.getByText(
        "This oboku server is not set up to send emails, so it cannot send a book to a Kindle.",
      ),
    ).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull()
  })

  it("saves a Kindle address, without the spaces around it", async () => {
    renderScreen()

    typeAddress("  reader_42@kindle.com ")
    await waitFor(() =>
      expect(getSaveButton()).toHaveProperty("disabled", false),
    )
    fireEvent.click(getSaveButton())

    await waitFor(() =>
      expect(mocks.saveKindleEmail).toHaveBeenCalledWith(
        "reader_42@kindle.com",
      ),
    )
  })

  it("does not save an address on another domain, and says which one it takes", async () => {
    renderScreen()

    typeAddress("reader@example.org")

    await waitFor(() =>
      expect(
        screen.getByText("Enter an address that ends with @kindle.com"),
      ).toBeTruthy(),
    )
    expect(getSaveButton()).toHaveProperty("disabled", true)
  })

  it("shows the saved address, with nothing to save until it changes", () => {
    renderScreen({ kindleEmail: "reader@kindle.com" })

    expect(getAddressField().getAttribute("value")).toBe("reader@kindle.com")
    expect(getSaveButton()).toHaveProperty("disabled", true)
  })

  it("removes the saved address once the user confirms", async () => {
    mocks.showConfirmDialog.mockResolvedValue(true)
    renderScreen({ kindleEmail: "reader@kindle.com" })

    fireEvent.click(
      screen.getByRole("button", { name: /^Remove your Kindle address/ }),
    )

    await waitFor(() =>
      expect(mocks.saveKindleEmail).toHaveBeenCalledWith(null),
    )
  })

  it("keeps the saved address when the user does not confirm", async () => {
    mocks.showConfirmDialog.mockResolvedValue(false)
    renderScreen({ kindleEmail: "reader@kindle.com" })

    fireEvent.click(
      screen.getByRole("button", { name: /^Remove your Kindle address/ }),
    )

    await waitFor(() => expect(mocks.showConfirmDialog).toHaveBeenCalled())
    expect(mocks.saveKindleEmail).not.toHaveBeenCalled()
  })

  it("offers no removal while no address is saved", () => {
    renderScreen()

    expect(
      screen.queryByRole("button", { name: /^Remove your Kindle address/ }),
    ).toBeNull()
  })
})
