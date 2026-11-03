import { text } from "node:stream/consumers"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import {
  allowServers,
  basicAuthorization,
  type ConnectorOptions,
  connectorFor,
  forgetAllowedServers,
  startServer,
} from "./catalog.fixture.js"
import { getFromCatalog } from "./client.js"

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

const readFromCatalog = async ({
  url,
  ...connector
}: ConnectorOptions & { url: string }) => {
  const { stream } = await getFromCatalog(connectorFor(connector), new URL(url))

  return text(stream)
}

describe("getFromCatalog", () => {
  afterEach(function resetRequests() {
    forgetAllowedServers()
    vi.mocked(getUserAddressRequestOptions).mockClear()
  })

  it("sends the connector's credentials to its origin only, redirects included", async () => {
    const files = await startServer({
      "/1.epub": { body: "epub bytes" },
    })
    const catalog = await startServer({
      "/opds/books/1/file": { body: "epub bytes" },
      "/opds/books/1/redirect": {
        status: 307,
        headers: { location: `${files.origin}/1.epub` },
      },
    })
    allowServers(catalog, files)
    const connectorUrl = `${catalog.origin}/opds`

    await expect(
      readFromCatalog({
        url: `${catalog.origin}/opds/books/1/file`,
        connectorUrl,
      }),
    ).resolves.toBe("epub bytes")
    await expect(
      readFromCatalog({
        url: `${catalog.origin}/opds/books/1/redirect`,
        connectorUrl,
      }),
    ).resolves.toBe("epub bytes")
    await expect(
      readFromCatalog({ url: `${files.origin}/1.epub`, connectorUrl }),
    ).resolves.toBe("epub bytes")

    expect(catalog.onRequest.mock.calls).toEqual([
      [{ path: "/opds/books/1/file", authorization: basicAuthorization }],
      [{ path: "/opds/books/1/redirect", authorization: basicAuthorization }],
    ])
    expect(files.onRequest.mock.calls).toEqual([
      [{ path: "/1.epub", authorization: undefined }],
      [{ path: "/1.epub", authorization: undefined }],
    ])
  })

  it("accepts a self-signed certificate from the connector's origin only", async () => {
    const files = await startServer({
      "/1.epub": { body: "epub bytes" },
    })
    const catalog = await startServer({
      "/opds/books/1/file": {
        status: 302,
        headers: { location: `${files.origin}/1.epub` },
      },
    })
    allowServers(catalog, files)

    await readFromCatalog({
      url: `${catalog.origin}/opds/books/1/file`,
      connectorUrl: catalog.origin,
      allowSelfSigned: true,
    })

    expect(vi.mocked(getUserAddressRequestOptions).mock.calls).toEqual([
      [{ allowSelfSigned: true }],
      [{ allowSelfSigned: false }],
    ])
  })

  it("answers with the URL the answer came from, after redirects", async () => {
    const catalog = await startServer({
      "/opds": { status: 301, headers: { location: "/opds/v1/" } },
      "/opds/v1/": { body: "feed" },
    })
    allowServers(catalog)

    const { stream, url } = await getFromCatalog(
      connectorFor({ connectorUrl: catalog.origin }),
      new URL(`${catalog.origin}/opds`),
    )

    await expect(text(stream)).resolves.toBe("feed")
    expect(url.href).toBe(`${catalog.origin}/opds/v1/`)
  })

  it("reports a catalog refusing the login as an unauthorized data source", async () => {
    const catalog = await startServer({
      "/opds": { status: 401, headers: { "www-authenticate": "Basic" } },
    })
    allowServers(catalog)

    const request = readFromCatalog({
      url: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    await expect(request).rejects.toBeInstanceOf(ObokuSharedError)
    await expect(request).rejects.toMatchObject({
      code: ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
    })
  })

  it("gives up after five redirects", async () => {
    const catalog = await startServer({
      "/opds": { status: 302, headers: { location: "/opds" } },
    })
    allowServers(catalog)

    await expect(
      readFromCatalog({
        url: `${catalog.origin}/opds`,
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
      readFromCatalog({
        url: `${catalog.origin}/opds`,
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
      readFromCatalog({
        url: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow("OPDS URLs must be http(s), not ftp:")
  })

  it("refuses a catalog on a private network the instance does not allow", async () => {
    const catalog = await startServer({ "/opds": { body: "feed" } })

    await expect(
      readFromCatalog({
        url: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toSatisfy(isNonPublicAddressError)
  })
})
