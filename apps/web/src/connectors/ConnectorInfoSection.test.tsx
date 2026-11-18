import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
  SynologyDriveConnectorDocType,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createConnectorConnectionsQueryOptions } from "./connection/connectorConnectionsQueryOptions"
import {
  ARCHIVE,
  NAS,
  OFFICE,
  toConnection,
} from "./connection/connectorConnection.fixture"
import { HttpClientApiContext } from "../http"
import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"
import { ConnectorInfoSection } from "./ConnectorInfoSection"

const mocks = vi.hoisted(function createConnectorInfoSectionMocks() {
  return { useSettings: vi.fn() }
})

vi.mock("../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
})

const SYNOLOGY: SynologyDriveConnectorDocType = {
  id: "synology",
  type: "synology-drive",
  url: "https://synology.example.com",
  username: "reader",
  passwordAsSecretId: "synology-password",
}

const renderSection = ({
  connectorType,
  connectors,
  answerConnections,
}: {
  connectorType: SettingsConnectorType
  connectors: SettingsConnectorDocType[]
  answerConnections: () => Promise<unknown>
}) => {
  mocks.useSettings.mockReturnValue({
    data: { _id: "settings", connectors },
    isSuccess: true,
  })
  const get = vi.fn(answerConnections)
  // test double: the section only calls the generated client's `get`
  const client = { sdkClient: { get } } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  })

  setActiveProfileId("profile")
  render(
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        <MemoryRouter>
          <ConnectorInfoSection connectorType={connectorType} />
        </MemoryRouter>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return { get, client, queryClient }
}

const findConnectorRow = (host: RegExp) =>
  screen.findByRole("button", { name: host })

describe("ConnectorInfoSection", () => {
  beforeEach(() => {
    mocks.useSettings.mockReset()
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
  })

  it("marks each WebDAV connector connected or changed since, and leaves one not connected unmarked", async () => {
    renderSection({
      connectorType: "webdav",
      connectors: [NAS, OFFICE, ARCHIVE],
      answerConnections: async () => ({
        data: {
          connections: [
            toConnection(NAS.id, "connected"),
            toConnection(OFFICE.id, "connector-changed"),
          ],
        },
      }),
    })

    expect(await findConnectorRow(/nas\.example\.com.*Connected/)).toBeTruthy()
    expect(await findConnectorRow(/office\.example\.com.*Changed/)).toBeTruthy()
    expect(
      (await findConnectorRow(/archive\.example\.com/)).textContent,
    ).not.toMatch(/Connected|Changed/)
  })

  it("marks no connector while the connections load, nor once they fail", async () => {
    const answer = Promise.withResolvers<never>()
    const { client, queryClient } = renderSection({
      connectorType: "webdav",
      connectors: [NAS],
      answerConnections: () => answer.promise,
    })
    const nas = await findConnectorRow(/nas\.example\.com/)

    expect(nas.textContent).not.toMatch(/Connected|Changed/)

    answer.reject(new Error("API unreachable"))
    const { queryKey } = createConnectorConnectionsQueryOptions({
      httpClientApi: client,
      profileId: "profile",
    })
    await expect
      .poll(() => queryClient.getQueryState(queryKey)?.status)
      .toBe("error")

    expect(nas.textContent).not.toMatch(/Connected|Changed/)
  })

  it("asks for no connection for a connector type that cannot connect", async () => {
    const { get } = renderSection({
      connectorType: "synology-drive",
      connectors: [SYNOLOGY],
      answerConnections: async () => ({ data: { connections: [] } }),
    })

    await findConnectorRow(/synology\.example\.com/)

    expect(get).not.toHaveBeenCalled()
  })
})
