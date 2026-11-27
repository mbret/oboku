import type {
  SynologyDriveConnectorDocType,
  WebdavConnectorDocType,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"

const mocks = vi.hoisted(function createConnectorFormMocks() {
  return {
    connector: vi.fn(),
    testConnectionProps: vi.fn(),
    updateConnector: vi.fn(),
  }
})

vi.mock("./useConnector", function mockConnector() {
  return {
    useConnector: function useConnector() {
      return { data: mocks.connector() }
    },
  }
})

vi.mock("./useUpdateConnector", function mockUpdateConnector() {
  return {
    useUpdateConnector: function useUpdateConnector() {
      return { mutateAsync: mocks.updateConnector }
    },
  }
})

vi.mock("./useAddConnector", function mockAddConnector() {
  return {
    useAddConnector: function useAddConnector() {
      return { mutateAsync: vi.fn() }
    },
  }
})

vi.mock("../secrets/useSecrets", function mockSecrets() {
  return {
    useSecrets: function useSecrets() {
      return { data: [{ _id: "koofr-secret", name: "Koofr app password" }] }
    },
  }
})

vi.mock("./TestConnection", function mockTestConnection() {
  return {
    TestConnection: function FakeTestConnection(props: unknown) {
      mocks.testConnectionProps(props)

      return <p>Connection test</p>
    },
  }
})

import { ConnectorForm } from "./ConnectorForm"

const koofrConnector: WebdavConnectorDocType = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "koofr-secret",
  proxyThroughServer: true,
}

const synologyConnector: SynologyDriveConnectorDocType = {
  id: "nas",
  type: "synology-drive",
  url: "https://nas.example.com",
  username: "reader",
  passwordAsSecretId: "koofr-secret",
}

const renderConnectorForm = (
  props: Pick<
    Parameters<typeof ConnectorForm>[0],
    "connectorType" | "showProxyThroughServer"
  >,
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConnectorForm
        {...props}
        connectorId="connector"
        onSubmitSuccess={vi.fn()}
        testConnection={vi.fn()}
        topAlert={null}
      />
    </QueryClientProvider>,
  )

describe("ConnectorForm", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("tests the connection with the proxy setting, and saves the setting once unchecked", async () => {
    mocks.connector.mockReturnValue(koofrConnector)
    mocks.updateConnector.mockResolvedValue(undefined)
    renderConnectorForm({
      connectorType: "webdav",
      showProxyThroughServer: true,
    })
    const proxyCheckbox = await screen.findByRole("checkbox", {
      name: "Use oboku's server as a proxy",
    })

    await expect.element(proxyCheckbox).toBeChecked()
    expect(screen.getByText("Connection test")).toBeDefined()
    expect(mocks.testConnectionProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        connectionData: {
          url: koofrConnector.url,
          username: koofrConnector.username,
          passwordAsSecretId: koofrConnector.passwordAsSecretId,
          allowSelfSigned: false,
          proxyThroughServer: true,
        },
      }),
    )

    await userEvent.click(proxyCheckbox)
    await expect
      .poll(() => mocks.testConnectionProps.mock.lastCall?.[0])
      .toMatchObject({ connectionData: { proxyThroughServer: false } })
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    await expect
      .poll(() => mocks.updateConnector.mock.calls)
      .toEqual([[expect.objectContaining({ proxyThroughServer: false })]])
  })

  it("asks for http:// or https://, and saves the address once it has one", async () => {
    mocks.connector.mockReturnValue(synologyConnector)
    mocks.updateConnector.mockResolvedValue(undefined)
    renderConnectorForm({ connectorType: "synology-drive" })
    const urlField = await screen.findByRole("textbox", { name: "URL" })
    const confirmButton = screen.getByRole("button", { name: "Confirm" })

    await userEvent.fill(urlField, "nas.local:5005/dav")

    await expect
      .element(
        screen.getByText(
          "Enter the full address, starting with http:// or https://",
        ),
      )
      .toBeVisible()
    await expect.element(confirmButton).toBeDisabled()

    await userEvent.fill(urlField, "http://nas.local:5005/dav")
    await userEvent.click(confirmButton)

    await expect
      .poll(() => mocks.updateConnector.mock.calls)
      .toEqual([
        [expect.objectContaining({ url: "http://nas.local:5005/dav" })],
      ])
  })

  it("leaves the setting out of a form that does not show it", async () => {
    mocks.connector.mockReturnValue(synologyConnector)
    mocks.updateConnector.mockResolvedValue(undefined)
    renderConnectorForm({ connectorType: "synology-drive" })
    await screen.findByRole("checkbox", {
      name: "Allow self-signed certificate",
    })

    expect(
      screen.queryByRole("checkbox", {
        name: "Use oboku's server as a proxy",
      }),
    ).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    await expect.poll(() => mocks.updateConnector.mock.calls).toHaveLength(1)
    expect(mocks.updateConnector.mock.calls[0]?.[0]).not.toHaveProperty(
      "proxyThroughServer",
    )
  })
})
