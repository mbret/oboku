import type {
  ServerConnectorDocType,
  SettingsConnectorDocType,
  WebdavConnectorDocType,
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

const mocks = vi.hoisted(function createUploadMocks() {
  return {
    connectWebdav: vi.fn(),
    extractConnectorData: vi.fn(),
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

vi.mock("./auth/connect", async function mockConnectWebdav(importOriginal) {
  return {
    ...(await importOriginal<typeof import("./auth/connect")>()),
    connectWebdav: mocks.connectWebdav,
  }
})

import { UploadBook as ServerPluginUploadBook } from "../../server/serverPlugin/UploadBook"
import { UploadBook as WebdavPluginUploadBook } from "./UploadBook"

const API_WEBDAV_URL = "https://api.oboku.test/webdav"

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
  mocks.connectWebdav.mockResolvedValue({
    client: { getDirectoryContents: vi.fn() },
    items: [bookFileStat],
  })
}

const renderUploadBook = (uploadBook: ReactElement) => {
  const onMutationError = vi.fn(function reportGlobalMutationError(
    _error: Error,
  ) {})
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{uploadBook}</MemoryRouter>
    </QueryClientProvider>,
  )

  return { onMutationError }
}

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
    expect(mocks.connectWebdav).toHaveBeenCalledWith({
      url: API_WEBDAV_URL,
      username: "reader",
      password: "password",
      path: "/",
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
    expect(mocks.connectWebdav).not.toHaveBeenCalled()
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
    expect(mocks.connectWebdav).toHaveBeenCalledWith({
      url: "https://dav.example.test/books",
      username: "reader",
      password: "password",
      path: "/",
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
