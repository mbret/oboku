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
import {
  ARCHIVE,
  NAS,
  OFFICE,
  toConnection,
} from "../../../connectors/connection/connectorConnection.fixture"
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

  return { get }
}

const linksIn = (sectionTitle: string) => {
  const section = screen.getByText(sectionTitle).nextElementSibling

  if (!(section instanceof HTMLElement)) throw new Error("No section list")

  return within(section)
    .queryAllByRole<HTMLAnchorElement>("link")
    .map((link) => [link.textContent, link.getAttribute("href")])
}

describe("CatalogSourcesSection", () => {
  beforeEach(() => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = true
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = true
    mocks.config.FEATURE_DROPBOX_ENABLED = true
    setConnectors([NAS, OFFICE, ARCHIVE])
  })

  afterEach(() => {
    cleanup()
    clearActiveProfileId()
    onlineManager.setOnline(true)
  })

  it("lists the connected Google account and connected WebDAV connectors as set up, each opening its screen", async () => {
    renderSection({
      googleConnection: GOOGLE_CONNECTION,
      connections: [
        toConnection(NAS.id, "connected"),
        toConnection(OFFICE.id, "connector-changed"),
      ],
    })

    await screen.findByRole("link", { name: /reader@example\.com/ })

    expect(linksIn("Sources set up")).toEqual([
      ["Google Drivereader@example.com", "/integrations/google"],
      [
        "WebDAVhttps://nas.example.com/dav/ (reader)",
        "/integrations/webdav/connectors/nas",
      ],
    ])
  })

  it("lists every kind of source catalogs serve as available, even one already set up", async () => {
    renderSection({
      googleConnection: GOOGLE_CONNECTION,
      connections: [toConnection(NAS.id, "connected")],
    })

    await screen.findByRole("link", { name: /reader@example\.com/ })

    expect(linksIn("Sources available")).toEqual([
      ["Google Drive", "/integrations/google"],
      ["WebDAV", "/integrations/webdav"],
    ])
  })

  it("says when nothing is set up yet", async () => {
    renderSection()

    expect(
      await screen.findByText("Nothing set up yet. Add a source below."),
    ).toBeTruthy()
    expect(linksIn("Sources set up")).toEqual([])
  })

  it("says the sources set up are loading, not that nothing is set up", async () => {
    renderSection({ answerGet: () => new Promise(() => {}) })

    expect(await screen.findByText("Loading the sources set up…")).toBeTruthy()
    expect(screen.queryByText(/Nothing set up yet/)).toBeNull()
  })

  it.each([
    [
      "they could not load",
      function failToLoad() {
        renderSection({
          answerGet: () => Promise.reject(new Error("API unreachable")),
        })
      },
    ],
    [
      "the browser is offline",
      function renderOffline() {
        onlineManager.setOnline(false)
        renderSection()
      },
    ],
  ])(
    "says the sources set up can't load when %s, not that nothing is set up",
    async (_, renderUnavailable) => {
      renderUnavailable()

      expect(
        await screen.findByText(
          "The sources set up can't be loaded right now.",
        ),
      ).toBeTruthy()
      expect(screen.queryByText(/Nothing set up yet/)).toBeNull()
    },
  )

  it.each([
    [
      "load",
      { data: undefined, isPending: true, fetchStatus: "fetching" },
      "Loading the sources set up…",
    ],
    [
      "fail to load",
      { data: undefined, isPending: false, isError: true, fetchStatus: "idle" },
      "The sources set up can't be loaded right now.",
    ],
  ])(
    "waits for the settings while they %s, and never says that nothing is set up",
    async (_, settingsQuery, note) => {
      mocks.useSettings.mockReturnValue(settingsQuery)
      const { get } = renderSection({ googleConnection: GOOGLE_CONNECTION })

      await vi.waitFor(async function waitForEveryAnswer() {
        expect(get).toHaveBeenCalledTimes(2)
        await Promise.all(get.mock.results.map(({ value }) => value))
      })
      await new Promise(function letTheAnswersRender(resolve) {
        setTimeout(resolve, 100)
      })

      expect(screen.getByText(note)).toBeTruthy()
      expect(screen.queryByText(/Nothing set up yet/)).toBeNull()
      expect(linksIn("Sources set up")).toEqual([])
    },
  )

  it("asks nothing of Google, and names it as not available, when the instance cannot connect a Google account", async () => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = false
    const { get } = renderSection({
      connections: [toConnection(NAS.id, "connected")],
    })

    await screen.findByRole("link", { name: /nas\.example\.com/ })

    expect(get.mock.calls.map(([{ url }]) => url)).not.toContain(
      "/provider-connections/google",
    )
    expect(linksIn("Sources available")).toEqual([
      ["WebDAV", "/integrations/webdav"],
    ])
    expect(screen.getByText(/Google Drive/).textContent).toBe(
      "Dropbox, Google Drive, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("lists Google Drive while this instance can connect a Google account, though it hides the Drive plugin", async () => {
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = false
    renderSection({ googleConnection: GOOGLE_CONNECTION })

    await screen.findByRole("link", { name: /reader@example\.com/ })

    expect(linksIn("Sources available")).toEqual([
      ["Google Drive", "/integrations/google"],
      ["WebDAV", "/integrations/webdav"],
    ])
  })

  it("names every kind of source the catalogs cannot serve yet on one line", () => {
    renderSection()

    expect(screen.getByText(/Dropbox/).textContent).toBe(
      "Dropbox, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("leaves out the kinds of source this instance hides", () => {
    mocks.config.FEATURE_DROPBOX_ENABLED = false
    renderSection()

    expect(screen.getByText(/OneDrive/).textContent).toBe(
      "Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })
})
