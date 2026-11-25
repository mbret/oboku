import type { WebdavConnectorDocType } from "@oboku/shared"
import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createLibrarySyncFormMocks() {
  return { connector: vi.fn(), testConnectionProps: vi.fn() }
})

vi.mock("../../../connectors/useConnector", function mockConnector() {
  return {
    useConnector: function useConnector() {
      return { data: mocks.connector() }
    },
  }
})

vi.mock("../../../connectors/TestConnection", function mockTestConnection() {
  return {
    TestConnection: function FakeTestConnection(props: unknown) {
      mocks.testConnectionProps(props)

      return <p>Connection test</p>
    },
  }
})

vi.mock("../../../http", async function mockHttpClientApi(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../../../http")>()),
    useHttpClientApi: function useHttpClientApi() {
      return {}
    },
  }
})

vi.mock(
  "../../../common/forms/ControlledConnectorSelector",
  function mockConnectorSelector() {
    return {
      ControlledConnectorSelector: function FakeConnectorSelector() {
        return null
      },
    }
  },
)

vi.mock(
  "../../plugins/common/LibrarySyncFormLayout",
  function mockLibrarySyncFormLayout() {
    return {
      LibrarySyncFormLayout: function FakeLibrarySyncFormLayout({
        children,
      }: {
        children: ReactNode
      }) {
        return <form>{children}</form>
      },
    }
  },
)

import { LibrarySyncForm } from "./LibrarySyncForm"

const koofrConnector: WebdavConnectorDocType = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "koofr-secret",
}

describe("LibrarySyncForm (WebDAV)", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it.each([
    ["without the proxy setting", koofrConnector, false],
    [
      "that uses oboku's server as a proxy",
      { ...koofrConnector, proxyThroughServer: true, allowSelfSigned: true },
      true,
    ],
  ])(
    "gives the connection test the connector %s",
    async (_, connector, isProxiedThroughServer) => {
      mocks.connector.mockReturnValue(connector)

      render(<LibrarySyncForm onSubmit={vi.fn()} submitLabel="Save" />)

      expect(await screen.findByText("Connection test")).toBeDefined()
      expect(mocks.testConnectionProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          connectionData: {
            url: connector.url,
            username: connector.username,
            passwordAsSecretId: connector.passwordAsSecretId,
            allowSelfSigned: connector.allowSelfSigned,
            proxyThroughServer: isProxiedThroughServer,
          },
        }),
      )
    },
  )
})
