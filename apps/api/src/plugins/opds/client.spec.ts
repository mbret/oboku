import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import {
  allowServers,
  basicAuthorization,
  bookEntry,
  downloadBook,
  feed,
  forgetAllowedServers,
  navigationEntry,
  startServer,
  syncFeed,
} from "./catalog.fixture.js"

vi.mock(
  "../../http/userAddressAgents.js",
  async function spyOnUserAddressRequestOptions(importOriginal) {
    const userAddressAgents =
      await importOriginal<typeof import("../../http/userAddressAgents.js")>()

    return {
      ...userAddressAgents,
      getUserAddressRequestOptions: vi.fn(
        userAddressAgents.getUserAddressRequestOptions,
      ),
    }
  },
)

describe("OPDS requests", () => {
  afterEach(function resetRequests() {
    forgetAllowedServers()
    vi.mocked(getUserAddressRequestOptions).mockClear()
  })

  it("sends the connector's credentials to its origin only, redirects included", async () => {
    const elsewhere = await startServer({
      "/series/b": {
        body: feed(
          bookEntry({ id: "urn:book:b", title: "Book B", href: "/b.epub" }),
        ),
      },
      "/series/c": {
        body: feed(
          bookEntry({ id: "urn:book:c", title: "Book C", href: "/c.epub" }),
        ),
      },
    })
    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({
            id: "urn:series:a",
            title: "Series A",
            href: "/opds/series/a",
          }),
          navigationEntry({
            id: "urn:series:b",
            title: "Series B",
            href: `${elsewhere.origin}/series/b`,
          }),
          navigationEntry({
            id: "urn:series:c",
            title: "Series C",
            href: "/opds/series/c",
          }),
        ),
      },
      "/opds/series/a": {
        body: feed(
          bookEntry({ id: "urn:book:a", title: "Book A", href: "/a.epub" }),
        ),
      },
      "/opds/series/c": {
        status: 302,
        headers: { location: `${elsewhere.origin}/series/c` },
      },
    })
    allowServers(catalog, elsewhere)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: `${catalog.origin}/opds`,
    })

    expect(items.map(({ name }) => name)).toEqual([
      "Series A",
      "Series B",
      "Series C",
    ])
    expect(catalog.onRequest.mock.calls).toEqual([
      [{ path: "/opds", authorization: basicAuthorization }],
      [{ path: "/opds/series/a", authorization: basicAuthorization }],
      [{ path: "/opds/series/c", authorization: basicAuthorization }],
    ])
    expect(elsewhere.onRequest.mock.calls).toEqual([
      [{ path: "/series/b", authorization: undefined }],
      [{ path: "/series/c", authorization: undefined }],
    ])
  })

  it("accepts a self-signed certificate from the connector's origin only", async () => {
    const elsewhere = await startServer({
      "/series/b": {
        body: feed(
          bookEntry({ id: "urn:book:b", title: "Book B", href: "/b" }),
        ),
      },
    })
    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({
            id: "urn:series:b",
            title: "Series B",
            href: `${elsewhere.origin}/series/b`,
          }),
        ),
      },
    })
    allowServers(catalog, elsewhere)

    await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
      allowSelfSigned: true,
    })

    expect(vi.mocked(getUserAddressRequestOptions).mock.calls).toEqual([
      [{ allowSelfSigned: true }],
      [{ allowSelfSigned: false }],
    ])
  })

  it("downloads a book with the connector's credentials", async () => {
    const catalog = await startServer({
      "/opds/books/1/file": { body: "epub bytes" },
    })
    allowServers(catalog)

    await expect(
      downloadBook({
        acquisitionHref: `${catalog.origin}/opds/books/1/file`,
        connectorUrl: catalog.origin,
      }),
    ).resolves.toBe("epub bytes")
    expect(catalog.onRequest.mock.calls).toEqual([
      [{ path: "/opds/books/1/file", authorization: basicAuthorization }],
    ])
  })

  it("reports a catalog refusing the login as an unauthorized data source", async () => {
    const catalog = await startServer({
      "/opds": { status: 401, headers: { "www-authenticate": "Basic" } },
    })
    allowServers(catalog)

    const sync = syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    await expect(sync).rejects.toBeInstanceOf(ObokuSharedError)
    await expect(sync).rejects.toMatchObject({
      code: ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
    })
  })

  it("gives up after five redirects", async () => {
    const catalog = await startServer({
      "/opds": { status: 302, headers: { location: "/opds" } },
    })
    allowServers(catalog)

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow(
      `OPDS request to ${catalog.origin} was redirected more than 5 times`,
    )
    expect(catalog.onRequest).toHaveBeenCalledTimes(6)
  })

  it("refuses a redirect to an address that does not parse", async () => {
    const catalog = await startServer({
      "/opds": { status: 302, headers: { location: "http://[catalog" } },
    })
    allowServers(catalog)

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow(
      `OPDS request to ${catalog.origin} was redirected to an invalid address`,
    )
  })

  it("refuses a redirect out of http(s)", async () => {
    const catalog = await startServer({
      "/opds": {
        status: 302,
        headers: { location: "ftp://catalog.example.com/opds" },
      },
    })
    allowServers(catalog)

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow("OPDS URLs must be http(s), not ftp:")
  })

  it("refuses an answer larger than a feed page", async () => {
    const catalog = await startServer({
      "/opds": { body: "x".repeat(6 * 1024 * 1024) },
    })
    allowServers(catalog)

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow("answered with more than a feed page")
  })

  it("refuses a catalog on a private network the instance does not allow", async () => {
    const catalog = await startServer({ "/opds": { body: feed() } })

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toSatisfy(isNonPublicAddressError)
  })
})
