import type {
  ConnectorConnectionDto,
  SettingsConnectorDocType,
  SettingsConnectorType,
  SynologyDriveConnectorDocType,
  WebdavConnectorDocType,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

const toWebdavConnector = (
  id: string,
  host: string,
): WebdavConnectorDocType => ({
  id,
  type: "webdav",
  url: `https://${host}/dav/`,
  username: "reader",
  passwordAsSecretId: `${id}-password`,
})

const NAS = toWebdavConnector("nas", "nas.example.com")
const OFFICE = toWebdavConnector("office", "office.example.com")
const ARCHIVE = toWebdavConnector("archive", "archive.example.com")
const SYNOLOGY: SynologyDriveConnectorDocType = {
  id: "synology",
  type: "synology-drive",
  url: "https://synology.example.com",
  username: "reader",
  passwordAsSecretId: "synology-password",
}

const toConnection = (
  connectorId: string,
  status: ConnectorConnectionDto["status"],
): ConnectorConnectionDto => ({
  connectorId,
  status,
  connectedAt: "2026-11-16T08:00:00.000Z",
})

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

  return { get }
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

  it("marks no connector when the connections cannot load", async () => {
    const { get } = renderSection({
      connectorType: "webdav",
      connectors: [NAS],
      answerConnections: () => Promise.reject(new Error("API unreachable")),
    })

    await vi.waitFor(() => expect(get).toHaveBeenCalled())

    expect(
      (await findConnectorRow(/nas\.example\.com/)).textContent,
    ).not.toMatch(/Connected|Changed/)
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
