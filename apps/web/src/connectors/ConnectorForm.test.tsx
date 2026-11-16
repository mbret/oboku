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
    TestConnection: function FakeTestConnection() {
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

  it("saves 'Use oboku's server as a proxy' once unchecked, and tests the connection from the browser only without it", async () => {
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
    expect(screen.queryByText("Connection test")).toBeNull()

    await userEvent.click(proxyCheckbox)
    await expect
      .poll(() => screen.queryByText("Connection test"))
      .not.toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))

    await expect
      .poll(() => mocks.updateConnector.mock.calls)
      .toEqual([[expect.objectContaining({ proxyThroughServer: false })]])
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
