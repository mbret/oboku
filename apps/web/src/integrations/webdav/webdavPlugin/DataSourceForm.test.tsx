import type { WebdavConnectorDocType } from "@oboku/shared"
import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createDataSourceFormMocks() {
  return { connector: vi.fn() }
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
    TestConnection: function FakeTestConnection() {
      return <p>Connection test</p>
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
  "../../plugins/common/DataSourceFormLayout",
  function mockDataSourceFormLayout() {
    return {
      DataSourceFormLayout: function FakeDataSourceFormLayout({
        children,
      }: {
        children: ReactNode
      }) {
        return <form>{children}</form>
      },
    }
  },
)

import { DataSourceForm } from "./DataSourceForm"

const koofrConnector: WebdavConnectorDocType = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "koofr-secret",
}

describe("DataSourceForm (WebDAV)", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("tests the connection from the browser", async () => {
    mocks.connector.mockReturnValue(koofrConnector)

    render(<DataSourceForm onSubmit={vi.fn()} submitLabel="Save" />)

    expect(await screen.findByText("Connection test")).toBeDefined()
  })

  it("leaves the connection test out for a connector that connects through oboku's server", async () => {
    mocks.connector.mockReturnValue({
      ...koofrConnector,
      connectThroughServer: true,
    })

    render(<DataSourceForm onSubmit={vi.fn()} submitLabel="Save" />)

    await screen.findByLabelText("Directory")
    expect(screen.queryByText("Connection test")).toBeNull()
  })
})
