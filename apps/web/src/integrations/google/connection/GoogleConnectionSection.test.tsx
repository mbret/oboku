import { type GoogleConnectionDto, ObokuErrorCode } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DialogProvider } from "../../../common/dialogs/DialogProvider"
import { dialogSignal } from "../../../common/dialogs/state"
import { HttpClientApiContext } from "../../../http"
import type { HttpApiClientWeb } from "../../../http/HttpClientApi.web"
import { HttpClientError } from "../../../http/httpClient.shared"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../../profiles/active/activeProfileId"
import { GoogleConnectionSection } from "./GoogleConnectionSection"

const { useConfig, requestCode } = vi.hoisted(function createSpies() {
  return { useConfig: vi.fn(), requestCode: vi.fn() }
})

vi.mock("../../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../../../config/useConfig", function mockConfig() {
  return { useConfig }
})

vi.mock("../gsi", async function mockGsi() {
  const { of } = await import("rxjs")
  const gsi = {
    accounts: {
      oauth2: {
        initCodeClient: function createCodeClient(
          config: google.accounts.oauth2.CodeClientConfig,
        ) {
          return {
            requestCode: function openPopup() {
              requestCode(config)
            },
          }
        },
      },
    },
  }

  return {
    gsiOrThrow$: of(gsi),
    gsiSignal: { getValue: () => ({ gsi, state: "loaded" }) },
  }
})

const CLIENT_ID = "123-oboku.apps.googleusercontent.com"
const CODE = "4/authorization-code"
const CONNECTION: GoogleConnectionDto = {
  accountName: "reader@gmail.com",
  connectedAt: "2026-11-11T08:00:00.000Z",
}

const grantCode = (config: google.accounts.oauth2.CodeClientConfig) => {
  config.callback?.({
    code: CODE,
    scope: "openid email",
    state: "",
    error: "",
    error_description: "",
    error_uri: "",
  })
}

const createApiError = (code: ObokuErrorCode) =>
  new HttpClientError(
    {
      response: new Response(),
      data: { errors: [{ code }] },
      status: 400,
      statusText: "",
      headers: {},
      config: { input: "https://api.example.com/provider-connections/google" },
    },
    undefined,
  )

const renderSection = ({
  connection,
}: {
  connection: GoogleConnectionDto | null
}) => {
  const api = {
    get: vi.fn().mockResolvedValue({ data: { connection } }),
    put: vi.fn().mockResolvedValue({ data: { connection: CONNECTION } }),
    delete: vi.fn().mockResolvedValue({ data: { ok: true } }),
  }
  // test double: the section only calls the generated client's HTTP methods
  const client = { sdkClient: api } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        <DialogProvider>
          <GoogleConnectionSection />
        </DialogProvider>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return api
}

describe("GoogleConnectionSection", () => {
  beforeEach(() => {
    setActiveProfileId("profile")
    requestCode.mockImplementation(grantCode)
    useConfig.mockReturnValue({
      data: {
        FEATURE_GOOGLE_CONNECTION_ENABLED: true,
        GOOGLE_CLIENT_ID: CLIENT_ID,
      },
    })
  })

  afterEach(() => {
    cleanup()
    dialogSignal.update([])
    clearActiveProfileId()
    vi.clearAllMocks()
  })

  it("shows nothing while the instance cannot connect Google accounts", () => {
    useConfig.mockReturnValue({
      data: { FEATURE_GOOGLE_CONNECTION_ENABLED: false },
    })

    const api = renderSection({ connection: null })

    expect(screen.queryByText("Google account")).toBeNull()
    expect(api.get).not.toHaveBeenCalled()
  })

  it("sends the code from Google's popup to the API, then shows the account", async () => {
    const api = renderSection({ connection: null })

    fireEvent.click(await screen.findByRole("button", { name: "Connect" }))

    expect(await screen.findByText(CONNECTION.accountName)).toBeTruthy()
    expect(requestCode).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.file openid email",
      }),
    )
    expect(api.put).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/provider-connections/google",
        body: { code: CODE },
      }),
    )
  })

  it("explains a connection the API refuses", async () => {
    const api = renderSection({ connection: null })
    api.put.mockRejectedValue(
      createApiError(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED,
      ),
    )

    fireEvent.click(await screen.findByRole("button", { name: "Connect" }))

    expect(
      await screen.findByText(/oboku needs every permission it asks for/),
    ).toBeTruthy()
  })

  it("shows no error when the user closes Google's popup", async () => {
    requestCode.mockImplementation(function keepPopupOpen() {})
    const api = renderSection({ connection: null })
    const connectButton = await screen.findByRole("button", {
      name: "Connect",
    })

    fireEvent.click(connectButton)

    await waitFor(() => {
      expect(connectButton.hasAttribute("disabled")).toBe(true)
    })

    const [popupConfig] = requestCode.mock.calls[0] ?? []

    popupConfig?.error_callback?.({
      name: "Error",
      message: "Popup window closed",
      type: "popup_closed",
    })

    await waitFor(() => {
      expect(connectButton.hasAttribute("disabled")).toBe(false)
    })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(api.put).not.toHaveBeenCalled()
  })

  it("asks to allow pop-ups when Google's window cannot open", async () => {
    requestCode.mockImplementation(function blockPopup(
      config: google.accounts.oauth2.CodeClientConfig,
    ) {
      config.error_callback?.({
        name: "Error",
        message: "Failed to open popup window",
        type: "popup_failed_to_open",
      })
    })
    renderSection({ connection: null })

    fireEvent.click(await screen.findByRole("button", { name: "Connect" }))

    expect(await screen.findByText(/Allow pop-ups for oboku/)).toBeTruthy()
  })

  it("disconnects once the user confirms", async () => {
    const api = renderSection({ connection: CONNECTION })
    api.get.mockResolvedValue({ data: { connection: null } })

    fireEvent.click(
      await screen.findByRole("button", {
        name: /Disconnect your Google account/,
      }),
    )
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }))

    expect(await screen.findByRole("button", { name: "Connect" })).toBeTruthy()
    expect(api.delete).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/provider-connections/google" }),
    )
  })

  it("keeps the connection when the user dismisses the confirmation", async () => {
    const api = renderSection({ connection: CONNECTION })

    fireEvent.click(
      await screen.findByRole("button", {
        name: /Disconnect your Google account/,
      }),
    )
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.getByText(CONNECTION.accountName)).toBeTruthy()
  })
})
