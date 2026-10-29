import { once } from "node:events"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { text } from "node:stream/consumers"
import type {
  DataSourceDocTypeFor,
  LinkDocTypeForProvider,
  OpdsConnectorDocType,
} from "@oboku/shared"
import type createNano from "nano"
import { SyncReport } from "../../datasource/sync/SyncReport.js"
import { setPrivateNetworkAllowedHosts } from "../../http/userAddressAgents.js"
import { dataSource as opdsDataSource } from "./index.js"

const username = "reader"
export const password = "opds-password-1234"
export const basicAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

export const ACQUISITION_REL = "http://opds-spec.org/acquisition"
export const ACQUISITION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=acquisition"

export const feed = (
  ...children: string[]
) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:catalog</id>
  <title>Catalog</title>
  <updated>2026-01-01T00:00:00Z</updated>
  ${children.join("\n  ")}
</feed>`

export const link = ({
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

export const entry = ({
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

export const navigationEntry = ({
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

export const bookEntry = ({
  id,
  title,
  href,
  type = "application/epub+zip",
  rel = ACQUISITION_REL,
  updated,
}: {
  id: string
  title: string
  href: string
  type?: string
  rel?: string
  updated?: string
}) => entry({ id, title, updated, links: [link({ rel, href, type })] })

export const nextPageLink = (href: string) =>
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

export async function startServer(routes: Record<string, Route>) {
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

export const allowServers = (...servers: { host: string }[]) =>
  setPrivateNetworkAllowedHosts(servers.map(({ host }) => host))

export const forgetAllowedServers = () => setPrivateNetworkAllowedHosts([])

type ConnectorOptions = {
  connectorUrl: string
  allowSelfSigned?: boolean
}

const createUserDbWithConnector = ({
  connectorUrl,
  allowSelfSigned,
}: ConnectorOptions) =>
  ({
    get: async () => ({
      _id: "settings",
      connectors: [
        {
          id: "connector",
          type: "opds",
          url: connectorUrl,
          username,
          passwordAsSecretId: "password-secret",
          allowSelfSigned,
        } satisfies OpdsConnectorDocType,
      ],
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

export const syncFeed = ({
  feedUrl,
  ...connector
}: ConnectorOptions & { feedUrl: string }) =>
  opdsDataSource.sync({
    userName: "user",
    dataSourceId: "data-source",
    dataSourceType: "opds",
    dataSource: dataSourceFor(feedUrl),
    providerCredentials: { password },
    syncReport: new SyncReport("data-source", "user"),
    db: createUserDbWithConnector(connector),
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

export const downloadBook = async ({
  acquisitionHref,
  ...connector
}: ConnectorOptions & { acquisitionHref: string }) => {
  const { stream } = await opdsDataSource.download(
    bookLink(acquisitionHref),
    { password },
    createUserDbWithConnector(connector),
  )

  return text(stream)
}
