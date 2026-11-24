import {
  type ConnectorConnectionDto,
  ObokuErrorCode,
  type PasswordSourceDto,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DialogProvider } from "../../common/dialogs/DialogProvider"
import { dialogSignal } from "../../common/dialogs/state"
import { CancelError } from "../../errors/errors.shared"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { HttpClientError } from "../../http/httpClient.shared"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../profiles/active/activeProfileId"
import {
  ConnectorConnectionSection,
  DisconnectConnectorListItem,
} from "./ConnectorConnectionSection"

const { extractConnectorData } = vi.hoisted(function createSpies() {
  return { extractConnectorData: vi.fn() }
})

vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../useExtractConnectorData", function mockExtractConnectorData() {
  return {
    useExtractConnectorData: function useExtractConnectorData() {
      return { mutateAsync: extractConnectorData }
    },
  }
})

const CONNECTOR_ID = "webdav-connector"
const PASSWORD = "dav-password"
const DECRYPTED_FROM = {
  connector: {
    id: CONNECTOR_ID,
    type: "webdav",
    url: "https://nas.example.com/dav/",
    username: "reader",
    passwordAsSecretId: "dav-password-secret",
  },
  passwordSecretValue: { iv: "password-iv", data: "encrypted-password" },
} satisfies PasswordSourceDto
const EXTRACTED_CONNECTOR_DATA = {
  data: { password: PASSWORD },
  decryptedFrom: DECRYPTED_FROM,
}
const CONNECTION: ConnectorConnectionDto = {
  connectorId: CONNECTOR_ID,
  status: "connected",
  connectedAt: "2026-11-16T08:00:00.000Z",
}
const CONNECTOR_URL = "/provider-connections/connectors/{connectorId}"

const createApiError = (code: ObokuErrorCode) =>
  new HttpClientError(
    {
      response: new Response(),
      data: { errors: [{ code }] },
      status: 400,
      statusText: "",
      headers: {},
      config: {
        input: `https://api.example.com/provider-connections/connectors/${CONNECTOR_ID}`,
      },
    },
    undefined,
  )

const renderSection = ({
  connections,
  loadError,
}: {
  connections: ConnectorConnectionDto[]
  loadError?: Error
}) => {
  const api = {
    get: loadError
      ? vi.fn().mockRejectedValue(loadError)
      : vi.fn().mockResolvedValue({ data: { connections } }),
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
          <ConnectorConnectionSection
            connectorId={CONNECTOR_ID}
            connectorType="webdav"
          />
          <DisconnectConnectorListItem connectorId={CONNECTOR_ID} />
        </DialogProvider>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return api
}

const clickConnectThenConsent = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Connect" }))

  const consentDialog = await screen.findByRole("dialog")

  expect(
    within(consentDialog).getByText(
      /oboku's server will keep this connector's password/,
    ),
  ).toBeTruthy()

  fireEvent.click(
    within(consentDialog).getByRole("button", { name: "Connect" }),
  )
}

describe("ConnectorConnectionSection", () => {
  beforeEach(() => {
    setActiveProfileId("profile")
    extractConnectorData.mockResolvedValue(EXTRACTED_CONNECTOR_DATA)
  })

  afterEach(() => {
    cleanup()
    dialogSignal.update([])
    clearActiveProfileId()
    vi.clearAllMocks()
  })

  it("sends the decrypted password, with what it was decrypted from, to oboku's server once the user consents, then shows the connection", async () => {
    const api = renderSection({ connections: [] })
    await screen.findByRole("button", { name: "Connect" })
    api.get.mockResolvedValue({ data: { connections: [CONNECTION] } })

    await clickConnectThenConsent()

    expect(await screen.findByText("Connected")).toBeTruthy()
    expect(extractConnectorData).toHaveBeenCalledWith({
      connectorId: CONNECTOR_ID,
    })
    expect(api.put).toHaveBeenCalledWith(
      expect.objectContaining({
        url: CONNECTOR_URL,
        path: { connectorId: CONNECTOR_ID },
        body: { password: PASSWORD, decryptedFrom: DECRYPTED_FROM },
      }),
    )
    expect(
      screen.getByRole("button", { name: /Disconnect this connector/ }),
    ).toBeTruthy()
  })

  it("keeps Connect loading until the refreshed connections arrive", async () => {
    const api = renderSection({ connections: [] })
    const connectButton = await screen.findByRole("button", {
      name: "Connect",
    })
    const { promise: connectionsRefetched, resolve: answerRefetch } =
      Promise.withResolvers<{
        data: { connections: ConnectorConnectionDto[] }
      }>()
    api.get.mockReturnValue(connectionsRefetched)

    await clickConnectThenConsent()
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(within(connectButton).getByRole("progressbar")).toBeTruthy()
    })
    expect(api.put).toHaveBeenCalled()

    answerRefetch({ data: { connections: [CONNECTION] } })

    expect(await screen.findByText("Connected")).toBeTruthy()
  })

  it("decrypts and sends nothing when the user does not consent", async () => {
    const api = renderSection({ connections: [] })

    fireEvent.click(await screen.findByRole("button", { name: "Connect" }))
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(extractConnectorData).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })

  it("explains a password the connector's server refuses", async () => {
    const api = renderSection({ connections: [] })
    api.put.mockRejectedValue(
      createApiError(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED),
    )

    await clickConnectThenConsent()

    expect(
      await screen.findByText(
        /The connector's server refused this username and password/,
      ),
    ).toBeTruthy()
  })

  it("shows no error when the user cancels the master password", async () => {
    extractConnectorData.mockRejectedValue(new CancelError())
    const api = renderSection({ connections: [] })

    await clickConnectThenConsent()

    await waitFor(() => {
      expect(extractConnectorData).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "Connect" })
          .hasAttribute("disabled"),
      ).toBe(false)
    })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(api.put).not.toHaveBeenCalled()
  })

  it("drops the password when another tab switches profiles while the master password is asked", async () => {
    const { promise: masterPasswordEntered, resolve: enterMasterPassword } =
      Promise.withResolvers<typeof EXTRACTED_CONNECTOR_DATA>()
    extractConnectorData.mockReturnValue(masterPasswordEntered)
    const api = renderSection({ connections: [] })

    await clickConnectThenConsent()
    await waitFor(() => {
      expect(extractConnectorData).toHaveBeenCalled()
    })

    setActiveProfileId("other-profile")
    enterMasterPassword(EXTRACTED_CONNECTOR_DATA)

    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "Connect" })
          .hasAttribute("disabled"),
      ).toBe(false)
    })
    expect(api.put).not.toHaveBeenCalled()
  })

  it("asks to connect again once the connector changed, and still offers to disconnect", async () => {
    const api = renderSection({
      connections: [{ ...CONNECTION, status: "connector-changed" }],
    })

    expect(
      await screen.findByText(/You changed this connector or its password/),
    ).toBeTruthy()
    api.get.mockResolvedValue({ data: { connections: [CONNECTION] } })
    expect(
      screen.getByRole("button", { name: /Disconnect this connector/ }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Connect again" }))
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Connect",
      }),
    )

    expect(await screen.findByText("Connected")).toBeTruthy()
    expect(api.put).toHaveBeenCalledWith(
      expect.objectContaining({ path: { connectorId: CONNECTOR_ID } }),
    )
  })

  it("disconnects once the user confirms", async () => {
    const api = renderSection({ connections: [CONNECTION] })
    api.get.mockResolvedValue({ data: { connections: [] } })

    fireEvent.click(
      await screen.findByRole("button", { name: /Disconnect this connector/ }),
    )
    fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }))

    expect(await screen.findByRole("button", { name: "Connect" })).toBeTruthy()
    expect(api.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        url: CONNECTOR_URL,
        path: { connectorId: CONNECTOR_ID },
      }),
    )
    expect(
      screen.queryByRole("button", { name: /Disconnect this connector/ }),
    ).toBeNull()
  })

  it("keeps the connection when another tab switches profiles while the disconnect confirmation is open", async () => {
    const api = renderSection({ connections: [CONNECTION] })

    fireEvent.click(
      await screen.findByRole("button", { name: /Disconnect this connector/ }),
    )
    const confirmButton = await screen.findByRole("button", {
      name: "Disconnect",
    })

    setActiveProfileId("other-profile")
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(api.delete).not.toHaveBeenCalled()
  })

  it("keeps the connection when the user dismisses the disconnect confirmation", async () => {
    const api = renderSection({ connections: [CONNECTION] })

    fireEvent.click(
      await screen.findByRole("button", { name: /Disconnect this connector/ }),
    )
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(api.delete).not.toHaveBeenCalled()
    expect(screen.getByText("Connected")).toBeTruthy()
  })

  it("explains connections that could not load, without offering to connect", async () => {
    renderSection({
      connections: [],
      loadError: new Error("The server could not be reached"),
    })

    expect(
      await screen.findByText("The server could not be reached"),
    ).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull()
  })
})
