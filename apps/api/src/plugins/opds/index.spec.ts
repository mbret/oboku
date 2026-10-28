import { once } from "node:events"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { text } from "node:stream/consumers"
import {
  type DataSourceDocTypeFor,
  type LinkDocTypeForProvider,
  ObokuErrorCode,
  ObokuSharedError,
  type OpdsConnectorDocType,
} from "@oboku/shared"
import type createNano from "nano"
import { SyncReport } from "../../datasource/sync/SyncReport.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { setPrivateNetworkAllowedHosts } from "../../http/userAddressAgents.js"
import { MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { dataSource as opdsDataSource } from "./index.js"

const username = "reader"
const password = "opds-password-1234"
const basicAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

const ACQUISITION_REL = "http://opds-spec.org/acquisition"
const ACQUISITION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=acquisition"

const feed = (...children: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:catalog</id>
  <title>Catalog</title>
  <updated>2026-01-01T00:00:00Z</updated>
  ${children.join("\n  ")}
</feed>`

const link = ({
  rel,
  href,
  type,
  length,
}: {
  rel: string
  href: string
  type: string
  length?: number
}) =>
  `<link rel="${rel}" href="${href}" type="${type}"${length === undefined ? "" : ` length="${length}"`}/>`

const entry = ({
  id,
  title,
  updated = "2026-02-01T00:00:00Z",
  links,
}: {
  id: string
  title: string
  updated?: string
  links: string[]
}) => `<entry>
    <title>${title}</title>
    <id>${id}</id>
    <updated>${updated}</updated>
    ${links.join("\n    ")}
  </entry>`

const navigationEntry = ({
  id,
  title,
  href,
  rel = "subsection",
}: {
  id: string
  title: string
  href: string
  rel?: string
}) =>
  entry({
    id,
    title,
    links: [link({ rel, href, type: ACQUISITION_FEED_TYPE })],
  })

const bookEntry = ({
  id,
  title,
  href,
  type = "application/epub+zip",
  rel = ACQUISITION_REL,
}: {
  id: string
  title: string
  href: string
  type?: string
  rel?: string
}) => entry({ id, title, links: [link({ rel, href, type })] })

const nextPageLink = (href: string) =>
  link({ rel: "next", href, type: ACQUISITION_FEED_TYPE })

type Route = {
  status?: number
  headers?: Record<string, string>
  body?: string
}

type ReceivedRequest = {
  path: string | undefined
  authorization: string | undefined
}

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

async function startServer(routes: Record<string, Route>) {
  const onRequest = vi.fn<(request: ReceivedRequest) => void>()
  const server = createServer(function answerFromRoutes(request, response) {
    onRequest({
      path: request.url,
      authorization: request.headers.authorization,
    })

    const route = routes[request.url ?? ""]

    if (!route) {
      response.writeHead(404)
      response.end()

      return
    }

    response.writeHead(route.status ?? 200, {
      "content-type": "application/atom+xml;charset=utf-8",
      ...route.headers,
    })
    response.end(route.body)
  }).listen(0, "127.0.0.1")

  onTestFinished(async function closeServer() {
    server.close()
    await once(server, "close")
  })

  await once(server, "listening")

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  const host = `127.0.0.1:${address.port}`

  return { host, origin: `http://${host}`, onRequest }
}

const allowServers = (...servers: { host: string }[]) =>
  setPrivateNetworkAllowedHosts(servers.map(({ host }) => host))

const connectorFor = (url: string): OpdsConnectorDocType => ({
  id: "connector",
  type: "opds",
  url,
  username,
  passwordAsSecretId: "password-secret",
})

const createUserDbWithConnector = (connectorUrl: string) =>
  ({
    get: async () => ({
      _id: "settings",
      connectors: [connectorFor(connectorUrl)],
    }),
    // Partial fake: getConnectorById only needs `get`.
  }) as unknown as createNano.DocumentScope<unknown>

const dataSourceFor = (feedUrl: string): DataSourceDocTypeFor<"opds"> => ({
  _id: "data-source",
  _rev: "1-data-source",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  type: "opds",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
  data_v2: { connectorId: "connector", feedUrl },
})

const syncFeed = ({
  feedUrl,
  connectorUrl,
}: {
  feedUrl: string
  connectorUrl: string
}) =>
  opdsDataSource.sync({
    userName: "user",
    dataSourceId: "data-source",
    dataSourceType: "opds",
    dataSource: dataSourceFor(feedUrl),
    providerCredentials: { password },
    syncReport: new SyncReport("data-source", "user"),
    db: createUserDbWithConnector(connectorUrl),
  })

const bookLink = (acquisitionHref: string): LinkDocTypeForProvider<"opds"> => ({
  _id: "link",
  _rev: "1-link",
  rxdbMeta: { lwt: 0 },
  rx_model: "link",
  type: "opds",
  book: "book",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  data: {
    connectorId: "connector",
    entryId: "urn:book:1",
    title: "Book 1",
    acquisition: { href: acquisitionHref, type: "application/epub+zip" },
  },
})

const downloadBook = async ({
  acquisitionHref,
  connectorUrl,
}: {
  acquisitionHref: string
  connectorUrl: string
}) => {
  const { stream } = await opdsDataSource.download(
    bookLink(acquisitionHref),
    { password },
    createUserDbWithConnector(connectorUrl),
  )

  return text(stream)
}

describe("OPDS data source", () => {
  afterEach(function forgetAllowedHosts() {
    setPrivateNetworkAllowedHosts([])
  })

  it("turns navigation entries into folders of the books their feeds hold", async () => {
    const catalog = await startServer({
      "/opds/series": {
        body: feed(
          navigationEntry({
            id: "urn:series:a",
            title: "Series A",
            href: "/opds/series/a",
          }),
        ),
      },
      "/opds/series/a": {
        body: feed(
          entry({
            id: "urn:book:1",
            title: "Book 1",
            updated: "2026-03-01T10:00:00+02:00",
            links: [
              link({
                rel: ACQUISITION_REL,
                href: "/opds/books/1.epub",
                type: "application/epub+zip",
                length: 1024,
              }),
            ],
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/series`,
      connectorUrl: catalog.origin,
    })

    expect(items).toEqual([
      {
        type: "folder",
        name: "Series A",
        modifiedAt: "2026-02-01T00:00:00.000Z",
        linkData: {
          connectorId: "connector",
          entryId: "urn:series:a",
          title: "Series A",
        },
        items: [
          {
            type: "file",
            name: "Book 1",
            modifiedAt: "2026-03-01T08:00:00.000Z",
            linkData: {
              connectorId: "connector",
              entryId: "urn:book:1",
              title: "Book 1",
              acquisition: {
                href: `${catalog.origin}/opds/books/1.epub`,
                type: "application/epub+zip",
                length: 1024,
              },
            },
          },
        ],
      },
    ])
  })

  it("reads every page of a feed once", async () => {
    const catalog = await startServer({
      "/opds/books": {
        body: feed(
          nextPageLink("/opds/books?page=2"),
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1.epub" }),
          bookEntry({ id: "urn:book:2", title: "Book 2", href: "/2.epub" }),
        ),
      },
      "/opds/books?page=2": {
        body: feed(
          nextPageLink("/opds/books"),
          bookEntry({ id: "urn:book:2", title: "Book 2", href: "/2.epub" }),
          bookEntry({ id: "urn:book:3", title: "Book 3", href: "/3.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/books`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual([
      "Book 1",
      "Book 2",
      "Book 3",
    ])
    expect(catalog.onRequest).toHaveBeenCalledTimes(2)
  })

  it("does not follow facets, searches or links back up the catalog", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          link({
            rel: "http://opds-spec.org/facet",
            href: "/opds/facet",
            type: ACQUISITION_FEED_TYPE,
          }),
          navigationEntry({
            id: "urn:start",
            title: "Start",
            href: "/opds/start",
            rel: "start",
          }),
          navigationEntry({
            id: "urn:up",
            title: "Up",
            href: "/opds/up",
            rel: "up",
          }),
          navigationEntry({
            id: "urn:search",
            title: "Search",
            href: "/opds/search",
            rel: "search",
          }),
          navigationEntry({
            id: "urn:sorted",
            title: "Sorted",
            href: "/opds/sorted",
            rel: "http://opds-spec.org/facet",
          }),
          navigationEntry({
            id: "urn:series:a",
            title: "Series A",
            href: "/opds/series/a",
          }),
        ),
      },
      "/opds/series/a": {
        body: feed(
          navigationEntry({ id: "urn:root", title: "Root", href: "/opds" }),
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      { name: "Series A", items: [{ type: "file", name: "Book 1" }] },
    ])
    expect(
      catalog.onRequest.mock.calls.map(([request]) => request.path),
    ).toEqual(["/opds", "/opds/series/a"])
  })

  it("resolves links against the URL a feed was served from", async () => {
    const catalog = await startServer({
      "/catalog": {
        status: 301,
        headers: { location: "/opds/v1/" },
      },
      "/opds/v1/": {
        body: feed(
          entry({
            id: "urn:series:a",
            title: "A",
            links: [
              '<link href="series/a" type="application/atom+xml;profile=opds-catalog"/>',
            ],
          }),
        ),
      },
      "/opds/v1/series/a": {
        body: feed(
          bookEntry({
            id: "urn:book:1",
            title: "Book 1",
            href: "../books/1.epub",
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/catalog`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        items: [
          {
            linkData: {
              acquisition: { href: `${catalog.origin}/opds/v1/books/1.epub` },
            },
          },
        ],
      },
    ])
  })

  it("takes the first format of a book it can read", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          entry({
            id: "urn:book:1",
            title: "Book 1",
            links: [
              link({
                rel: ACQUISITION_REL,
                href: "/1.mobi",
                type: "application/x-mobipocket-ebook",
              }),
              link({
                rel: ACQUISITION_REL,
                href: "/1.epub",
                type: "application/epub+zip",
              }),
              link({
                rel: ACQUISITION_REL,
                href: "/1.pdf",
                type: "application/pdf",
              }),
            ],
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        linkData: {
          acquisition: {
            href: `${catalog.origin}/1.epub`,
            type: "application/epub+zip",
          },
        },
      },
    ])
  })

  it("only takes books that are free", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          bookEntry({
            id: "urn:buy",
            title: "Bought",
            href: "/buy",
            rel: `${ACQUISITION_REL}/buy`,
          }),
          bookEntry({
            id: "urn:borrow",
            title: "Borrowed",
            href: "/borrow",
            rel: `${ACQUISITION_REL}/borrow`,
          }),
          bookEntry({
            id: "urn:sample",
            title: "Sampled",
            href: "/sample",
            rel: `${ACQUISITION_REL}/sample`,
          }),
          bookEntry({
            id: "urn:subscribe",
            title: "Subscribed",
            href: "/subscribe",
            rel: `${ACQUISITION_REL}/subscribe`,
          }),
          bookEntry({
            id: "urn:open-access",
            title: "Free",
            href: "/free.epub",
            rel: `${ACQUISITION_REL}/open-access`,
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual(["Free"])
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

  it("downloads a book with the connector's credentials on its origin only", async () => {
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

    await expect(
      downloadBook({
        acquisitionHref: `${catalog.origin}/opds/books/1/file`,
        connectorUrl: catalog.origin,
      }),
    ).resolves.toBe("epub bytes")
    await expect(
      downloadBook({
        acquisitionHref: `${catalog.origin}/opds/books/1/redirect`,
        connectorUrl: catalog.origin,
      }),
    ).resolves.toBe("epub bytes")
    await expect(
      downloadBook({
        acquisitionHref: `${files.origin}/1.epub`,
        connectorUrl: catalog.origin,
      }),
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

  it("refuses a catalog on a private network the instance does not allow", async () => {
    const catalog = await startServer({ "/opds": { body: feed() } })

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toSatisfy(isNonPublicAddressError)
  })

  it("stops following navigation ten feeds deep", async () => {
    const depths = Array.from({ length: 12 }, (_, depth) => depth)
    const catalog = await startServer(
      Object.fromEntries(
        depths.map(function toFeedLinkingDeeper(depth) {
          return [
            `/opds/${depth}`,
            {
              body: feed(
                bookEntry({
                  id: `urn:book:${depth}`,
                  title: `Book ${depth}`,
                  href: `/${depth}.epub`,
                }),
                navigationEntry({
                  id: `urn:level:${depth + 1}`,
                  title: `Level ${depth + 1}`,
                  href: `/opds/${depth + 1}`,
                }),
              ),
            },
          ]
        }),
      ),
    )
    allowServers(catalog)

    await syncFeed({
      feedUrl: `${catalog.origin}/opds/0`,
      connectorUrl: catalog.origin,
    })

    expect(catalog.onRequest).toHaveBeenCalledTimes(11)
    expect(catalog.onRequest).toHaveBeenLastCalledWith({
      path: "/opds/10",
      authorization: basicAuthorization,
    })
  })

  it("answers file metadata from what the last sync saw", async () => {
    const metadata = await opdsDataSource.getFileMetadata({
      link: {
        type: "opds",
        data: {
          connectorId: "connector",
          entryId: "urn:book:1",
          title: "Book 1",
          acquisition: {
            href: "https://catalog.example.com/1.epub",
            type: "application/epub+zip",
            length: 1024,
          },
        },
      },
      providerCredentials: { password },
    })

    expect(metadata).toEqual({
      name: "Book 1",
      canDownload: true,
      contentType: "application/epub+zip",
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
      bookMetadata: { size: "1024" },
    })
  })
})
