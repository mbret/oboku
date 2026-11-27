import {
  createApiClient,
  type LinkDocTypeForSource,
  type OpdsConnectorDocType,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext, type HttpApiClientWeb } from "../../../http"

const mocks = vi.hoisted(function createDownloadMocks() {
  return {
    download: vi.fn(),
    extractConnectorData: vi.fn(),
  }
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

vi.mock("../../../http/useDownload", function mockDownload() {
  return {
    useDownload: function useDownload() {
      return { mutateAsync: mocks.download }
    },
  }
})

import { DownloadBook } from "./DownloadBook"

const BOOK_BYTES = "epub bytes"
const PASSWORD = "komga-password"
const DUNE_FILE_URL = "https://komga.example.com/opds/books/dune/file"

const komgaConnector: OpdsConnectorDocType = {
  id: "komga",
  type: "opds",
  url: "https://komga.example.com/opds",
  username: "reader",
  passwordAsSecretId: "komga-secret",
}

const duneLink: LinkDocTypeForSource<"opds"> = {
  _id: "link-dune",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  type: "opds",
  data: {
    connectorId: komgaConnector.id,
    entryId: "urn:book:dune",
    title: "Dune",
    acquisition: {
      href: DUNE_FILE_URL,
      type: "application/epub+zip",
    },
  },
  book: "book-dune",
  rx_model: "link",
  modifiedAt: null,
  createdAt: "2026-11-27T00:00:00.000Z",
}

const renderDownloadBook = (api: typeof fetch) => {
  // DownloadBook only calls the API through `sdkClient`; the double cast lets
  // a client on a stubbed fetch stand in for the full client.
  const httpClientApi = {
    sdkClient: createApiClient({
      baseUrl: "https://api.oboku.test",
      throwOnError: true,
      fetch: api,
    }),
  } as unknown as HttpApiClientWeb
  const onError = vi.fn()
  const onResolve = vi.fn()

  render(
    <QueryClientProvider client={new QueryClient()}>
      <HttpClientApiContext.Provider value={httpClientApi}>
        <DownloadBook
          link={duneLink}
          onDownloadProgress={vi.fn()}
          onError={onError}
          onResolve={onResolve}
          signal={new AbortController().signal}
        />
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return { onError, onResolve }
}

describe("DownloadBook (OPDS)", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("downloads the book through oboku's server, named after its title, when the connector uses it as a proxy", async () => {
    mocks.extractConnectorData.mockResolvedValue({
      data: { ...komgaConnector, proxyThroughServer: true, password: PASSWORD },
    })
    const api = vi.fn<typeof fetch>(async function serveBookFile() {
      return new Response(BOOK_BYTES, {
        headers: { "Content-Type": "application/epub+zip" },
      })
    })

    const { onError, onResolve } = renderDownloadBook(api)

    await expect.poll(() => onResolve.mock.calls).toHaveLength(1)
    const result = onResolve.mock.lastCall?.[0]
    expect(result?.fileName).toBe("Dune.epub")
    expect(await result?.data.text()).toBe(BOOK_BYTES)
    const apiRequest = api.mock.lastCall?.[0]
    expect(apiRequest).toBeInstanceOf(Request)
    if (!(apiRequest instanceof Request)) return
    expect(apiRequest.url).toBe("https://api.oboku.test/links/download")
    expect(await apiRequest.json()).toEqual({
      linkId: duneLink._id,
      providerCredentials: { password: PASSWORD },
    })
    expect(mocks.download).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it("downloads the book from the catalog without the setting", async () => {
    mocks.extractConnectorData.mockResolvedValue({
      data: { ...komgaConnector, password: PASSWORD },
    })
    mocks.download.mockResolvedValue({
      data: new Blob([BOOK_BYTES]),
      headers: {},
      status: 200,
      statusText: "OK",
    })
    const api = vi.fn<typeof fetch>()

    const { onResolve } = renderDownloadBook(api)

    await expect.poll(() => onResolve.mock.calls).toHaveLength(1)
    expect(mocks.download).toHaveBeenCalledWith(
      expect.objectContaining({ url: DUNE_FILE_URL }),
    )
    expect(api).not.toHaveBeenCalled()
  })
})
