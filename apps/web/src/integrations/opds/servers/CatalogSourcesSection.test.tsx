import type {
  ConnectorConnectionDto,
  GoogleConnectionDto,
  WebdavConnectorDocType,
} from "@oboku/shared"
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../../../http"
import type { HttpApiClientWeb } from "../../../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../../profiles/active/activeProfileId"
import { CatalogSourcesSection } from "./CatalogSourcesSection"

const mocks = vi.hoisted(function createCatalogSourcesMocks() {
  return {
    config: {
      FEATURE_GOOGLE_CONNECTION_ENABLED: true,
      FEATURE_GOOGLE_DRIVE_ENABLED: true,
      FEATURE_DROPBOX_ENABLED: true,
      FEATURE_ONE_DRIVE_ENABLED: true,
      FEATURE_SERVER_SYNC_ENABLED: true,
      SHOW_DISABLED_PLUGINS: false,
    },
    useSettings: vi.fn(),
  }
})

vi.mock("../../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../../../config/useConfig", function mockConfig() {
  return { useConfig: () => ({ data: mocks.config }) }
})

vi.mock("../../../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
})

const GOOGLE_CONNECTION: GoogleConnectionDto = {
  accountName: "reader@example.com",
  connectedAt: "2026-11-16T08:00:00.000Z",
}

const toConnector = (id: string, host: string): WebdavConnectorDocType => ({
  id,
  type: "webdav",
  url: `https://${host}/dav/`,
  username: "reader",
  passwordAsSecretId: `${id}-password`,
})

const NAS = toConnector("nas", "nas.example.com")
const OFFICE = toConnector("office", "office.example.com")
const ARCHIVE = toConnector("archive", "archive.example.com")

const toConnection = (
  connectorId: string,
  status: ConnectorConnectionDto["status"],
): ConnectorConnectionDto => ({
  connectorId,
  status,
  connectedAt: "2026-11-16T08:00:00.000Z",
})

const setConnectors = (connectors: WebdavConnectorDocType[]) => {
  mocks.useSettings.mockReturnValue({
    data: { _id: "settings", connectors },
    isSuccess: true,
  })
}

const renderSection = ({
  googleConnection = null,
  connections = [],
  answerGet,
}: {
  googleConnection?: GoogleConnectionDto | null
  connections?: ConnectorConnectionDto[]
  answerGet?: () => Promise<unknown>
} = {}) => {
  const get = vi.fn(async function answerByUrl({ url }: { url: string }) {
    if (answerGet) return answerGet()

    if (url === "/provider-connections/google") {
      return { data: { connection: googleConnection } }
    }

    if (url === "/provider-connections/connectors") {
      return { data: { connections } }
    }

    throw new Error(`Unexpected request to ${url}`)
  })
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
          <CatalogSourcesSection />
        </MemoryRouter>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )
}

const findSourceLink = (name: RegExp) =>
  screen.findByRole<HTMLAnchorElement>("link", { name })

describe("CatalogSourcesSection", () => {
  beforeEach(() => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = true
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = true
    mocks.config.FEATURE_DROPBOX_ENABLED = true
    setConnectors([NAS])
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    onlineManager.setOnline(true)
  })

  it("lists Google Drive as set up while the Google account is connected, linking to the Google screen", async () => {
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    const googleDrive = await findSourceLink(
      /Google Drive Set up\. Catalogs list its books\./,
    )

    expect(googleDrive.getAttribute("href")).toBe("/integrations/google")
  })

  it("lists Google Drive as waiting to set up while no Google account is connected", async () => {
    renderSection({ googleConnection: null })

    expect(
      await findSourceLink(
        /Google Drive Waiting to set up\. Connect your Google account\./,
      ),
    ).toBeTruthy()
  })

  it("names Google Drive with the sources not available when the instance cannot connect a Google account", async () => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = false
    renderSection()

    await findSourceLink(/WebDAV|nas\.example\.com/)

    expect(screen.queryByRole("link", { name: /Google Drive/ })).toBeNull()
    expect(screen.getByText(/Google Drive/).textContent).toBe(
      "Dropbox, Google Drive, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("lists each WebDAV connector by address and username with its state, linking to the connector", async () => {
    setConnectors([NAS, OFFICE, ARCHIVE])
    renderSection({
      connections: [
        toConnection(NAS.id, "connected"),
        toConnection(OFFICE.id, "connector-changed"),
      ],
    })

    const nas = await findSourceLink(
      /https:\/\/nas\.example\.com\/dav\/ \(reader\) Set up\. Catalogs list its books\./,
    )
    const office = await findSourceLink(
      /office\.example\.com.*Waiting to set up\. You changed this connector or its password\. Connect it again\./,
    )
    const archive = await findSourceLink(
      /archive\.example\.com.*Waiting to set up\. Connect this connector\./,
    )

    expect(nas.getAttribute("href")).toBe("/integrations/webdav/connectors/nas")
    expect(office.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/office",
    )
    expect(archive.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/archive",
    )
  })

  it("offers to add a WebDAV connector when there is none", async () => {
    setConnectors([])
    renderSection()

    const webdav = await findSourceLink(
      /WebDAV Waiting to set up\. Add a connector, then connect it\./,
    )

    expect(webdav.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/new",
    )
  })

  it("names every kind of source the catalogs cannot serve yet on one line", async () => {
    renderSection()

    expect(await screen.findByText("Not available yet")).toBeTruthy()
    expect(screen.getByText(/Dropbox/).textContent).toBe(
      "Dropbox, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("leaves out the kinds of source this instance hides", async () => {
    mocks.config.FEATURE_DROPBOX_ENABLED = false
    renderSection()

    expect(await screen.findByText("Not available yet")).toBeTruthy()
    expect(screen.getByText(/OneDrive/).textContent).toBe(
      "Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("lists no Google Drive row, and does not name it, when this instance hides Google Drive", async () => {
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = false
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    await findSourceLink(/nas\.example\.com/)

    expect(screen.queryByText(/Google Drive/)).toBeNull()
  })

  it.each([
    ["load", { data: undefined, isSuccess: false, isPending: true }],
    ["fail to load", { data: undefined, isSuccess: false, isError: true }],
  ])("shows no WebDAV row while the settings %s", async (_, settingsQuery) => {
    mocks.useSettings.mockReturnValue(settingsQuery)
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    await findSourceLink(/Google Drive Set up/)

    expect(screen.queryByRole("link", { name: /WebDAV/ })).toBeNull()
    expect(screen.queryByText(/Waiting to set up/)).toBeNull()
  })

  it("says a state is loading rather than calling its source waiting", async () => {
    renderSection({ answerGet: () => new Promise(() => {}) })

    expect(await findSourceLink(/Google Drive Loading its state…/)).toBeTruthy()
    expect(
      await findSourceLink(/nas\.example\.com.*Loading its state…/),
    ).toBeTruthy()
    expect(screen.queryByText(/Waiting to set up/)).toBeNull()
  })

  it("says a state could not load rather than calling its source waiting", async () => {
    renderSection({
      answerGet: () => Promise.reject(new Error("API unreachable")),
    })

    expect(
      await findSourceLink(
        /Google Drive Something went wrong while loading its state\./,
      ),
    ).toBeTruthy()
    expect(
      await findSourceLink(
        /nas\.example\.com.*Something went wrong while loading its state\./,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Waiting to set up/)).toBeNull()
  })

  it("says a state can't load while the browser is offline", async () => {
    onlineManager.setOnline(false)
    renderSection()

    expect(
      await findSourceLink(
        /Google Drive Its state can't be loaded right now\./,
      ),
    ).toBeTruthy()
    expect(
      await findSourceLink(
        /nas\.example\.com.*Its state can't be loaded right now\./,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Waiting to set up/)).toBeNull()
  })
})
