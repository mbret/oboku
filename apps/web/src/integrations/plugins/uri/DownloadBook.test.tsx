import { createApiClient, type LinkDocTypeForSource } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext, type HttpApiClientWeb } from "../../../http"

const mocks = vi.hoisted(function createDownloadMocks() {
  return { download: vi.fn() }
})

vi.mock("../../../http/useDownload", function mockDownload() {
  return {
    useDownload: function useDownload() {
      return { mutateAsync: mocks.download }
    },
  }
})

import { DownloadBook } from "./DownloadBook"

const BOOK_BYTES = "epub bytes"
const BOOK_URL = "https://nas.example.com/file/45646578"

const createWebLink = (
  data: LinkDocTypeForSource<"URI">["data"],
): LinkDocTypeForSource<"URI"> => ({
  _id: "link-dune",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  type: "URI",
  data,
  book: "book-dune",
  rx_model: "link",
  modifiedAt: null,
  createdAt: "2026-11-27T00:00:00.000Z",
})

const renderDownloadBook = ({
  link,
  api,
}: {
  link: LinkDocTypeForSource<"URI">
  api: typeof fetch
}) => {
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
          link={link}
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

describe("DownloadBook (web address)", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("downloads the book through oboku's server, with no credentials, keeping its type, when the book uses the proxy", async () => {
    const api = vi.fn<typeof fetch>(async function serveBookFile() {
      return new Response(BOOK_BYTES, {
        headers: { "Content-Type": "application/epub+zip" },
      })
    })
    const link = createWebLink({ url: BOOK_URL, proxyThroughServer: true })

    const { onError, onResolve } = renderDownloadBook({ link, api })

    await expect.poll(() => onResolve.mock.calls).toHaveLength(1)
    const result = onResolve.mock.lastCall?.[0]
    expect(result?.fileName).toBe("45646578")
    expect(result?.data.type).toBe("application/epub+zip")
    expect(await result?.data.text()).toBe(BOOK_BYTES)
    const apiRequest = api.mock.lastCall?.[0]
    expect(apiRequest).toBeInstanceOf(Request)
    if (!(apiRequest instanceof Request)) return
    expect(apiRequest.url).toBe("https://api.oboku.test/links/download")
    expect(await apiRequest.json()).toEqual({ linkId: link._id })
    expect(mocks.download).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it("downloads the book from its address without the setting", async () => {
    mocks.download.mockResolvedValue({
      data: new Blob([BOOK_BYTES]),
      headers: {},
      status: 200,
      statusText: "OK",
    })
    const api = vi.fn<typeof fetch>()

    const { onResolve } = renderDownloadBook({
      link: createWebLink({ url: BOOK_URL }),
      api,
    })

    await expect.poll(() => onResolve.mock.calls).toHaveLength(1)
    expect(mocks.download).toHaveBeenCalledWith(
      expect.objectContaining({ url: BOOK_URL }),
    )
    expect(api).not.toHaveBeenCalled()
  })
})
