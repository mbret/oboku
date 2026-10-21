import { createHash } from "node:crypto"
import { once } from "node:events"
import { createServer, type IncomingMessage } from "node:http"
import type { AddressInfo } from "node:net"
import type {
  DataSourceDocTypeFor,
  WebdavConnectorDocType,
} from "@oboku/shared"
import type createNano from "nano"
import { isNonPublicAddressError } from "../../lib/http/publicAddress.js"
import { setPrivateNetworkAllowedHosts } from "../../lib/http/userAddressAgents.js"
import { SyncReport } from "../../lib/sync/SyncReport.js"
import { buildMultiStatusXml } from "../../webdav/webdav.xml.js"
import { dataSource as webdavDataSource } from "./index.js"

const username = "reader"
const password = "webdav-password-1234"
const realm = "nas"
const nonce = "5ccc069c403ebaf9f0171e9517f40e41"
const lastModified = new Date("2026-01-01T00:00:00.000Z")

const dataSource: DataSourceDocTypeFor<"webdav"> = {
  _id: "data-source",
  _rev: "1-data-source",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  type: "webdav",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
  data_v2: { connectorId: "connector", directory: "books" },
}

const booksListing = buildMultiStatusXml([
  {
    href: "/books/",
    displayName: "books",
    isDirectory: true,
    size: 0,
    lastModified,
    mimeType: "",
    etag: null,
  },
  {
    href: "/books/book.epub",
    displayName: "book.epub",
    isDirectory: false,
    size: 1024,
    lastModified,
    mimeType: "application/epub+zip",
    etag: null,
  },
])

const md5 = (value: string) => createHash("md5").update(value).digest("hex")

const readDigestFields = (authorization: string) =>
  new Map(
    Array.from(
      authorization.matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]*))/g),
      ([, name = "", quotedValue, value = ""]): [string, string] => [
        name,
        quotedValue ?? value,
      ],
    ),
  )

const isAuthorizedWithBasic = ({ headers }: IncomingMessage) =>
  headers.authorization ===
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

function isAuthorizedWithDigest({ headers, method, url }: IncomingMessage) {
  if (!headers.authorization?.startsWith("Digest ")) return false

  const fields = readDigestFields(headers.authorization)
  const ha1 = md5(`${username}:${realm}:${password}`)
  const ha2 = md5(`${method}:${url}`)
  const expectedResponse = md5(
    `${ha1}:${nonce}:${fields.get("nc")}:${fields.get("cnonce")}:${fields.get("qop")}:${ha2}`,
  )

  return fields.get("response") === expectedResponse
}

type ServerAuth = {
  scheme: string
  challenge: string
  isAuthorized: (request: IncomingMessage) => boolean
}

const basicAuth: ServerAuth = {
  scheme: "Basic",
  challenge: `Basic realm="${realm}"`,
  isAuthorized: isAuthorizedWithBasic,
}

const digestAuth: ServerAuth = {
  scheme: "Digest",
  challenge: `Digest realm="${realm}", nonce="${nonce}", qop="auth"`,
  isAuthorized: isAuthorizedWithDigest,
}

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

async function startBooksServer({ challenge, isAuthorized }: ServerAuth) {
  const server = createServer(
    function answerAuthorizedPropfind(request, response) {
      if (!isAuthorized(request)) {
        response.writeHead(401, { "www-authenticate": challenge })
        response.end()

        return
      }

      response.writeHead(207, {
        "content-type": "application/xml; charset=utf-8",
      })
      response.end(booksListing)
    },
  ).listen(0, "127.0.0.1")

  onTestFinished(async function closeBooksServer() {
    server.close()
    await once(server, "close")
  })

  await once(server, "listening")

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  return `127.0.0.1:${address.port}`
}

const createUserDbWithConnector = (url: string) => {
  const connector: WebdavConnectorDocType = {
    id: "connector",
    type: "webdav",
    url,
    username,
    passwordAsSecretId: "password-secret",
  }

  return {
    get: async () => ({ _id: "settings", connectors: [connector] }),
    // Partial fake: getConnectorById only needs `get`.
  } as unknown as createNano.DocumentScope<unknown>
}

const syncBooksFrom = (host: string) =>
  webdavDataSource.sync({
    userName: "user",
    dataSourceId: dataSource._id,
    dataSourceType: "webdav",
    dataSource,
    providerCredentials: { password },
    syncReport: new SyncReport(dataSource._id, "user"),
    db: createUserDbWithConnector(`http://${host}`),
  })

describe("WebDAV data source", () => {
  afterEach(function forgetAllowedHosts() {
    setPrivateNetworkAllowedHosts([])
  })

  it.each([basicAuth, digestAuth])(
    "syncs a server that only accepts $scheme auth",
    async (serverAuth) => {
      const host = await startBooksServer(serverAuth)
      setPrivateNetworkAllowedHosts([host])

      const { items } = await syncBooksFrom(host)

      expect(items).toEqual([
        {
          type: "file",
          name: "book.epub",
          modifiedAt: lastModified.toISOString(),
          linkData: { connectorId: "connector", filePath: "/books/book.epub" },
        },
      ])
    },
  )

  it("refuses a server on a private network the instance does not allow", async () => {
    const host = await startBooksServer(basicAuth)

    await expect(syncBooksFrom(host)).rejects.toSatisfy(isNonPublicAddressError)
  })
})
