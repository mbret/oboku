import {
  createApiClient,
  type LinkDocTypeForSource,
  type WebdavConnectorDocType,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext, type HttpApiClientWeb } from "../../../http"

const mocks = vi.hoisted(function createDownloadMocks() {
  return {
    createWebdavClient: vi.fn(),
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

vi.mock(
  "./auth/connect",
  async function mockCreateWebdavClient(importOriginal) {
    return {
      ...(await importOriginal<typeof import("./auth/connect")>()),
      createWebdavClient: mocks.createWebdavClient,
    }
  },
)

import { DownloadBook } from "./DownloadBook"

const BOOK_BYTES = "epub bytes"
const PASSWORD = "koofr-app-password"

const koofrConnector: WebdavConnectorDocType = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "koofr-secret",
}

const duneLink: LinkDocTypeForSource<"webdav"> = {
  _id: "link-dune",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  type: "webdav",
  data: { connectorId: koofrConnector.id, filePath: "/Books/Dune.epub" },
  book: "book-dune",
  rx_model: "link",
  modifiedAt: null,
  createdAt: "2026-11-16T00:00:00.000Z",
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

  const { unmount } = render(
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

  return { onError, onResolve, unmount }
}

describe("DownloadBook (WebDAV)", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("downloads the book through oboku's server when the connector uses it as a proxy", async () => {
    mocks.extractConnectorData.mockResolvedValue({
      data: {
        ...koofrConnector,
        proxyThroughServer: true,
        password: PASSWORD,
      },
    })
    const api = vi.fn<typeof fetch>(async function serveBookFile() {
      return new Response(BOOK_BYTES, {
        headers: { "Content-Type": "application/octet-stream" },
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
    expect(apiRequest.method).toBe("POST")
    expect(apiRequest.url).toBe("https://api.oboku.test/links/download")
    expect(await apiRequest.json()).toEqual({
      linkId: duneLink._id,
      providerCredentials: { password: PASSWORD },
    })
    expect(mocks.createWebdavClient).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it("aborts the request to oboku's server once unmounted", async () => {
    mocks.extractConnectorData.mockResolvedValue({
      data: {
        ...koofrConnector,
        proxyThroughServer: true,
        password: PASSWORD,
      },
    })
    const api = vi.fn<typeof fetch>(function holdBookFileUntilAborted(input) {
      return new Promise(function rejectOnAbort(_, reject) {
        if (!(input instanceof Request)) return

        input.signal.addEventListener("abort", function rejectAbortedRequest() {
          reject(input.signal.reason)
        })
      })
    })

    const { unmount } = renderDownloadBook(api)
    await expect.poll(() => api.mock.calls).toHaveLength(1)
    const apiRequest = api.mock.lastCall?.[0]
    unmount()

    expect(apiRequest).toBeInstanceOf(Request)
    if (!(apiRequest instanceof Request)) return
    expect(apiRequest.signal.aborted).toBe(true)
  })

  it("downloads the book from the WebDAV server without the setting", async () => {
    mocks.extractConnectorData.mockResolvedValue({
      data: { ...koofrConnector, password: PASSWORD },
    })
    const getFileContents = vi.fn(async function readBookFile() {
      return new TextEncoder().encode(BOOK_BYTES).buffer
    })
    mocks.createWebdavClient.mockReturnValue({ getFileContents })
    const api = vi.fn<typeof fetch>()

    const { onResolve } = renderDownloadBook(api)

    await expect.poll(() => onResolve.mock.calls).toHaveLength(1)
    expect(await onResolve.mock.lastCall?.[0]?.data.text()).toBe(BOOK_BYTES)
    expect(getFileContents).toHaveBeenCalledWith("/Books/Dune.epub", {
      format: "binary",
      signal: expect.any(AbortSignal),
    })
    expect(api).not.toHaveBeenCalled()
  })
})
