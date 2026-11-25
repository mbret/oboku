import {
  createApiClient,
  type ServerConnectorDocType,
  type SettingsConnectorDocType,
  type WebdavConnectorDocType,
  type WebdavDirectoryItemDto,
} from "@oboku/shared"
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router"
import type { FileStat } from "webdav"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext, type HttpApiClientWeb } from "../../../http"

const mocks = vi.hoisted(function createUploadMocks() {
  return {
    createWebdavClient: vi.fn(),
    extractConnectorData: vi.fn(),
    notifyError: vi.fn(),
    useConfig: vi.fn(),
    useConnectors: vi.fn(),
  }
})

vi.mock("../../../config/useConfig", function mockConfig() {
  return { useConfig: mocks.useConfig }
})

vi.mock("../../../connectors/useConnectors", function mockConnectors() {
  return { useConnectors: mocks.useConnectors }
})

vi.mock(
  "../../../connectors/useExtractConnectorData",
  function mockExtractConnectorData() {
    return {
      useExtractConnectorData: function useExtractConnectorData() {
        return { mutateAsync: mocks.extractConnectorData }
      },
    }
  },
)

vi.mock(
  "./auth/connect",
  async function mockCreateWebdavClient(importOriginal) {
    return {
      ...(await importOriginal<typeof import("./auth/connect")>()),
      createWebdavClient: mocks.createWebdavClient,
    }
  },
)

vi.mock(
  "../../../notifications/toasts",
  async function spyOnNotifyError(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../../notifications/toasts")
      >()),
      notifyError: mocks.notifyError,
    }
  },
)

import { UploadBook as ServerPluginUploadBook } from "../../server/serverPlugin/UploadBook"
import { UploadBook as WebdavPluginUploadBook } from "./UploadBook"

const API_URL = "https://api.oboku.test"
const API_WEBDAV_URL = `${API_URL}/webdav`

const serverConnector: ServerConnectorDocType = {
  id: "server-connector",
  type: "server",
  username: "reader",
  passwordAsSecretId: "server-secret",
}

const webdavConnector: WebdavConnectorDocType = {
  id: "webdav-connector",
  type: "webdav",
  url: "https://dav.example.test/books",
  username: "reader",
  passwordAsSecretId: "webdav-secret",
}

const bookFileStat: FileStat = {
  filename: "/book.epub",
  basename: "book.epub",
  lastmod: "Thu, 01 Jan 2026 00:00:00 GMT",
  size: 1,
  type: "file",
  etag: "book-etag",
  mime: "application/epub+zip",
}

const booksDirectoryItem: WebdavDirectoryItemDto = {
  filename: "/Books",
  basename: "Books",
  type: "directory",
}

const duneItem: WebdavDirectoryItemDto = {
  filename: "/Books/Dune.epub",
  basename: "Dune.epub",
  type: "file",
  mime: "application/epub+zip",
  etag: "dune-etag",
}

async function grantPopup() {
  return true
}

function NoTagsSelector() {
  return null
}

const givenConnector = (connector: SettingsConnectorDocType) => {
  mocks.useConnectors.mockReturnValue({ data: [connector] })
  mocks.extractConnectorData.mockResolvedValue({
    data: { ...connector, password: "password" },
  })
  mocks.createWebdavClient.mockReturnValue({
    getDirectoryContents: vi.fn(async function listBookFile() {
      return [bookFileStat]
    }),
  })
}

const renderUploadBook = (
  uploadBook: ReactElement,
  api = vi.fn<typeof fetch>(),
) => {
  const onMutationError = vi.fn(function reportGlobalMutationError(
    _error: Error,
  ) {})
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  })
  // The upload only calls the API through `sdkClient`; the double cast lets
  // a client on a stubbed fetch stand in for the full client.
  const httpClientApi = {
    sdkClient: createApiClient({
      baseUrl: API_URL,
      throwOnError: true,
      fetch: api,
    }),
  } as unknown as HttpApiClientWeb

  render(
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={httpClientApi}>
        <MemoryRouter>{uploadBook}</MemoryRouter>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return { onMutationError }
}

const toDirectoryRequest = async (input: RequestInfo | URL) => {
  if (!(input instanceof Request)) throw new Error("Expected a Request")

  return {
    method: input.method,
    url: input.url,
    body: await input.clone().json(),
  }
}

const serveDirectories = (
  serveDirectory: (path: string) => Promise<Response>,
) =>
  vi.fn<typeof fetch>(async function serveDirectoryOfRequest(input) {
    const { body } = await toDirectoryRequest(input)

    return serveDirectory(body.path)
  })

const addTheBookFile = async () => {
  const bookItem = await screen.findByRole("treeitem", { name: /book\.epub/ })

  fireEvent.click(within(bookItem).getByRole("checkbox", { hidden: true }))
  fireEvent.click(screen.getByRole("button", { name: "Add 1 book" }))
}

describe("WebDAV upload", function testWebdavUpload() {
  afterEach(function cleanUpUploadBook() {
    cleanup()
    vi.clearAllMocks()
  })

  it("adds server links through the oboku server WebDAV URL, not the connector URL", async function addServerLinks() {
    givenConnector({ ...serverConnector, url: "https://dav.example.test" })
    mocks.useConfig.mockReturnValue({ data: { API_WEBDAV_URL } })
    const onClose = vi.fn()
    renderUploadBook(
      <ServerPluginUploadBook
        onClose={onClose}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))

    expect(await screen.findByText("Connected to oboku server")).toBeTruthy()
    expect(mocks.createWebdavClient).toHaveBeenCalledWith({
      url: API_WEBDAV_URL,
      username: "reader",
      password: "password",
    })

    await addTheBookFile()

    expect(onClose).toHaveBeenCalledWith([
      {
        book: { metadata: [{ title: "book.epub", type: "link" }] },
        link: {
          type: "server",
          data: {
            connectorId: "server-connector",
            filePath: "/book.epub",
            etag: "book-etag",
          },
        },
      },
    ])
  })

  it("fails to connect to the server without a WebDAV URL", async function failWithoutWebdavUrl() {
    givenConnector(serverConnector)
    mocks.useConfig.mockReturnValue({ data: undefined })
    const { onMutationError } = renderUploadBook(
      <ServerPluginUploadBook
        onClose={vi.fn()}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))

    await waitFor(function waitForConnectFailure() {
      expect(onMutationError).toHaveBeenCalledTimes(1)
    })

    expect(onMutationError.mock.calls[0]?.[0]?.message).toBe(
      "No WebDAV URL available",
    )
    expect(mocks.createWebdavClient).not.toHaveBeenCalled()
  })

  it("offers no new server connector once one exists", function hideNewServerConnector() {
    givenConnector(serverConnector)
    mocks.useConfig.mockReturnValue({ data: { API_WEBDAV_URL } })
    renderUploadBook(
      <ServerPluginUploadBook
        onClose={vi.fn()}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    expect(screen.queryByRole("button", { name: "New connector" })).toBeNull()
  })

  it("adds webdav links through the connector URL", async function addWebdavLinks() {
    givenConnector(webdavConnector)
    const onClose = vi.fn()
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={onClose}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    expect(screen.getByRole("button", { name: "New connector" })).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))

    expect(
      await screen.findByText(
        "Connected with connector https://dav.example.test/books",
      ),
    ).toBeTruthy()
    expect(mocks.createWebdavClient).toHaveBeenCalledWith({
      url: "https://dav.example.test/books",
      username: "reader",
      password: "password",
    })

    await addTheBookFile()

    expect(onClose).toHaveBeenCalledWith([
      {
        book: { metadata: [{ title: "book.epub", type: "link" }] },
        link: {
          type: "webdav",
          data: {
            connectorId: "webdav-connector",
            filePath: "/book.epub",
            etag: "book-etag",
          },
        },
      },
    ])
  })

  it("lists the folders through oboku's server when the connector uses it as a proxy", async function listThroughServerProxy() {
    givenConnector({ ...webdavConnector, proxyThroughServer: true })
    const api = serveDirectories(async function serveBooksFolder(path) {
      return Response.json({
        items: path === "/" ? [booksDirectoryItem] : [duneItem],
      })
    })
    const onClose = vi.fn()
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={onClose}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
      api,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    fireEvent.click(await screen.findByText("Books"))
    const duneTreeItem = await screen.findByRole("treeitem", {
      name: /^Dune\.epub/,
    })
    fireEvent.click(
      within(duneTreeItem).getByRole("checkbox", { hidden: true }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Add 1 book" }))

    expect(onClose).toHaveBeenCalledWith([
      {
        book: { metadata: [{ title: "Dune.epub", type: "link" }] },
        link: {
          type: "webdav",
          data: {
            connectorId: "webdav-connector",
            filePath: "/Books/Dune.epub",
            etag: "dune-etag",
          },
        },
      },
    ])
    const directoryRequests = await Promise.all(
      api.mock.calls.map(([input]) => toDirectoryRequest(input)),
    )
    expect(directoryRequests).toEqual(
      ["/", "/Books"].map((path) => ({
        method: "POST",
        url: `${API_URL}/connectors/webdav/directory`,
        body: {
          url: "https://dav.example.test/books",
          username: "reader",
          providerCredentials: { password: "password" },
          path,
        },
      })),
    )
    expect(mocks.createWebdavClient).not.toHaveBeenCalled()
  })

  it("hands the error of a folder listing through oboku's server to the error toast", async function notifyProxiedListingError() {
    givenConnector({ ...webdavConnector, proxyThroughServer: true })
    const listingError = new Error("The server refused the folder")
    const api = serveDirectories(async function refuseBooksFolder(path) {
      if (path !== "/") throw listingError

      return Response.json({ items: [booksDirectoryItem] })
    })
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={vi.fn()}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
      api,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    fireEvent.click(await screen.findByText("Books"))

    await expect
      .poll(() => mocks.notifyError.mock.calls)
      .toEqual([[listingError]])
  })

  it("hands the error of a folder listing from the WebDAV server to the error toast", async function notifyDirectListingError() {
    givenConnector(webdavConnector)
    const listingError = Object.assign(new Error("Invalid response: 403"), {
      status: 403,
    })
    mocks.createWebdavClient.mockReturnValue({
      getDirectoryContents: vi.fn(async function refuseBooksFolder(path) {
        if (path !== "/") throw listingError

        return [{ ...bookFileStat, ...booksDirectoryItem, etag: null }]
      }),
    })
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={vi.fn()}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    fireEvent.click(await screen.findByText("Books"))

    await expect
      .poll(() => mocks.notifyError.mock.calls)
      .toEqual([[listingError]])
    expect(mocks.createWebdavClient).toHaveBeenCalledTimes(1)
  })

  it("closes without books from either step", async function cancelFromEitherStep() {
    givenConnector(webdavConnector)
    const onClose = vi.fn()
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={onClose}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    await screen.findByRole("button", { name: "Go back" })
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose.mock.calls).toEqual([[], []])
  })

  it("goes back from the files to the connector selection", async function goBackToConnectorSelection() {
    givenConnector(webdavConnector)
    renderUploadBook(
      <WebdavPluginUploadBook
        onClose={vi.fn()}
        requestPopup={grantPopup}
        TagsSelector={NoTagsSelector}
        title="Add a book"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    fireEvent.click(await screen.findByRole("button", { name: "Go back" }))

    expect(screen.getByRole("button", { name: "Connect" })).toBeTruthy()
    expect(screen.queryByRole("treeitem", { name: /book\.epub/ })).toBeNull()
  })
})
