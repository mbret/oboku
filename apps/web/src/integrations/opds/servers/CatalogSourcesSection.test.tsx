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
import { cleanup, render, screen, within } from "@testing-library/react"
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

const findSourceState = async (name: RegExp, state: string) =>
  within(await findSourceLink(name)).findByRole("img", { name: state })

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

  it("shows Google Drive as set up while the Google account is connected, linking to the Google screen", async () => {
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    const googleDrive = await findSourceLink(/Google Drive/)

    expect(
      await within(googleDrive).findByRole("img", { name: "Set up" }),
    ).toBeTruthy()
    expect(googleDrive.getAttribute("href")).toBe("/integrations/google")
  })

  it("shows Google Drive as not set up while no Google account is connected", async () => {
    renderSection({ googleConnection: null })

    expect(await findSourceState(/Google Drive/, "Not set up")).toBeTruthy()
  })

  it("names Google Drive with the sources not available when the instance cannot connect a Google account", async () => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = false
    renderSection()

    await findSourceLink(/nas\.example\.com/)

    expect(screen.queryByRole("link", { name: /Google Drive/ })).toBeNull()
    expect(screen.getByText(/Google Drive/).textContent).toBe(
      "Dropbox, Google Drive, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("shows each WebDAV connector by address and username with its state, linking to the connector", async () => {
    setConnectors([NAS, OFFICE, ARCHIVE])
    renderSection({
      connections: [
        toConnection(NAS.id, "connected"),
        toConnection(OFFICE.id, "connector-changed"),
      ],
    })

    const nas = await findSourceLink(
      /https:\/\/nas\.example\.com\/dav\/ \(reader\)/,
    )
    const office = await findSourceLink(/office\.example\.com/)
    const archive = await findSourceLink(/archive\.example\.com/)

    expect(await within(nas).findByRole("img", { name: "Set up" })).toBeTruthy()
    expect(
      await within(office).findByRole("img", { name: "Not set up" }),
    ).toBeTruthy()
    expect(
      await within(archive).findByRole("img", { name: "Not set up" }),
    ).toBeTruthy()
    expect(nas.getAttribute("href")).toBe("/integrations/webdav/connectors/nas")
    expect(office.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/office",
    )
    expect(archive.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/archive",
    )
  })

  it("shows WebDAV as not set up, linking to a new connector, when there is none", async () => {
    setConnectors([])
    renderSection()

    const webdav = await findSourceLink(/WebDAV/)

    expect(
      await within(webdav).findByRole("img", { name: "Not set up" }),
    ).toBeTruthy()
    expect(webdav.getAttribute("href")).toBe(
      "/integrations/webdav/connectors/new",
    )
  })

  it("shows no text under a source, only its name and its state icon", async () => {
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    const googleDrive = await findSourceLink(/Google Drive/)
    await within(googleDrive).findByRole("img", { name: "Set up" })

    expect(googleDrive.querySelector(".MuiListItemText-secondary")).toBeNull()
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

  it("shows Google Drive while this instance can connect a Google account, though it hides the Drive plugin", async () => {
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = false
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    expect(await findSourceState(/Google Drive/, "Set up")).toBeTruthy()
  })

  it.each([
    ["load", { data: undefined, isSuccess: false, isPending: true }],
    ["fail to load", { data: undefined, isSuccess: false, isError: true }],
  ])("shows no WebDAV row while the settings %s", async (_, settingsQuery) => {
    mocks.useSettings.mockReturnValue(settingsQuery)
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    await findSourceState(/Google Drive/, "Set up")

    expect(screen.queryByRole("link", { name: /WebDAV/ })).toBeNull()
    expect(screen.queryByRole("img", { name: "Not set up" })).toBeNull()
  })

  it("shows a state that is loading as loading, not as not set up", async () => {
    renderSection({ answerGet: () => new Promise(() => {}) })

    for (const source of [/Google Drive/, /nas\.example\.com/]) {
      expect(
        await within(await findSourceLink(source)).findByRole("progressbar", {
          name: "Loading its state",
        }),
      ).toBeTruthy()
    }
    expect(screen.queryByRole("img", { name: "Not set up" })).toBeNull()
  })

  it.each([
    [
      "a state that could not load",
      function failToLoad() {
        renderSection({
          answerGet: () => Promise.reject(new Error("API unreachable")),
        })
      },
    ],
    [
      "a state the browser cannot load offline",
      function renderOffline() {
        onlineManager.setOnline(false)
        renderSection()
      },
    ],
  ])("shows %s as unavailable, not as not set up", async (_, render) => {
    render()

    for (const source of [/Google Drive/, /nas\.example\.com/]) {
      expect(
        await findSourceState(source, "Its state could not load"),
      ).toBeTruthy()
    }
    expect(screen.queryByRole("img", { name: "Not set up" })).toBeNull()
  })
})
