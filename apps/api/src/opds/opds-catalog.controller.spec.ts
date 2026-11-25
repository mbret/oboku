import { once } from "node:events"
import { createServer, type IncomingMessage } from "node:http"
import type { AddressInfo } from "node:net"
import { Readable } from "node:stream"
import { type INestApplication, Logger, StreamableFile } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import {
  getBookCoverKey,
  ObokuErrorCode,
  type SecretDocType,
  type WebdavConnectorDocType,
} from "@oboku/shared"
import { Test } from "@nestjs/testing"
import { of } from "rxjs"
import request from "supertest"
import type { App } from "supertest/types.js"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { AtRestCipher } from "../crypto/at-rest-cipher.js"
import { hashSecret } from "../crypto/secretHash.js"
import type {
  OpdsServerPostgresEntity,
  SourceConnectionPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { SourceConnectionPostgresService } from "../features/postgres/source-connection-postgres.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { createObokuBadRequest } from "../http/obokuBadRequest.js"
import { setPrivateNetworkAllowedHosts } from "../http/userAddressAgents.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { ConnectorConnectionService } from "../source-connections/connectors/connector-connection.service.js"
import { GoogleConnectionService } from "../source-connections/google/google-connection.service.js"
import {
  createConnectionStore,
  toConnectionRowKey,
} from "../source-connections/source-connection-store.fixture.js"
import { SourceConnectionsService } from "../source-connections/source-connections.service.js"
import { buildMultiStatusXml } from "../webdav/webdav.xml.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import { OpdsAuthenticationController } from "./opds-authentication.controller.js"
import { OpdsBasicAuthGuard } from "./opds-basic-auth.guard.js"
import { OpdsCatalogController } from "./opds-catalog.controller.js"
import { OpdsAuthService } from "./opds-auth.service.js"
import { OpdsBooksService } from "./opds-books.service.js"

/** An account created before emails were normalized: its CouchDB user name keeps the casing it signed up with. */
const OWNER: UserPostgresEntity = {
  id: 1,
  email: "reader@example.com",
  username: "reader@example.com",
  couchName: "Reader@Example.com",
  createdAt: new Date(),
}

/** An account that has not signed in since its CouchDB user name is recorded. */
const NEWCOMER: UserPostgresEntity = {
  id: 2,
  email: "newcomer@example.com",
  username: "newcomer@example.com",
  createdAt: new Date(),
}
const OWNER_SESSION = "reader-session"
const PASSWORD = "k7mq-x2fp-9dwa-hc4n"

const SERVER: OpdsServerPostgresEntity = {
  id: 7,
  user_id: OWNER.id,
  slug: "calm-snails-dream",
  name: `Kids' <books> & "more"`,
  password_hash: hashSecret(PASSWORD),
  created_at: new Date(),
}

const NEWCOMER_SERVER: OpdsServerPostgresEntity = {
  ...SERVER,
  id: 8,
  user_id: NEWCOMER.id,
  slug: "quiet-owls-wait",
}

const ownerTokenPayload: TokenPayload = {
  name: OWNER.email,
  sub: OWNER.email,
  userId: OWNER.id,
  "couchdb.roles": [],
}

const OPDS_CHALLENGE = 'Basic realm="oboku-opds", charset="UTF-8"'

const API_HOST = "api.oboku.test"

const toAuthenticationDocument = (slug: string, protocol = "https") => ({
  id: `${protocol}://${API_HOST}/opds/${slug}/authentication`,
  title: "oboku",
  description:
    "Sign in with the email of your oboku account and the password of this OPDS server.",
  authentication: [
    {
      type: "http://opds-spec.org/auth/basic",
      labels: { login: "Email", password: "Server password" },
    },
  ],
})

/** The ids of the shelves an OPDS 1.2 feed lists, in its order. */
const toListedShelfIds = (feedXml: string) =>
  Array.from(
    feedXml.matchAll(/<id>urn:oboku:opds:[^:<]+:shelves:([^<]+)<\/id>/g),
    ([, shelfId]) => shelfId,
  )

/** The ids of the books an OPDS 1.2 feed lists, in its order. */
const toListedBookIds = (feedXml: string) =>
  Array.from(
    feedXml.matchAll(/<id>urn:oboku:opds:[^:<]+:books:([^<]+)<\/id>/g),
    ([, bookId]) => bookId,
  )

/** Express adds a charset and sorts the parameters, which leaves the type the same. */
const toMediaTypeParts = (contentType: string | undefined) =>
  new Set(contentType?.split(";").map((part) => part.trim()))

const toBasicAuthorization = (credentials: string) =>
  `Basic ${Buffer.from(credentials, "utf8").toString("base64")}`

const OWNER_AUTHORIZATION = toBasicAuthorization(`${OWNER.email}:${PASSWORD}`)

const serverStore: Pick<OpdsServerPostgresService, "findBySlug"> = {
  findBySlug: async (slug) =>
    [SERVER, NEWCOMER_SERVER].find((server) => server.slug === slug) ?? null,
}

const userStore: Pick<UserPostgresService, "findById"> = {
  findById: async (userId) =>
    [OWNER, NEWCOMER].find((user) => user.id === userId) ?? null,
}

const DRIVE_ACCESS_TOKEN = "ya29.minted-drive-token"
const BOOK_BYTES = "epub bytes"
const COVER_BYTES = "jpeg bytes"
const DRIVE_METADATA_SIZE = 12
const PROXIED_DOWNLOAD_BYTES_MAX_PER_MONTH = 500 * 1000 ** 3
const PROXIED_DOWNLOAD_USER_QUOTA_BYTES = 25 * 1000 ** 3

const DRIVE_LINK = {
  _id: "link-drive",
  rx_model: "link",
  type: "DRIVE",
  data: { fileId: "drive-file-dune" },
  book: "book-dune",
}

const DROPBOX_LINK = {
  _id: "link-dropbox",
  rx_model: "link",
  type: "dropbox",
  data: { fileId: "dropbox-file" },
  book: "book-dropbox",
}

const PROTECTED_TAG = { _id: "tag-private", rx_model: "tag", isProtected: true }

const NAS_PASSWORD = "nas-password-1234"

const NAS_PASSWORD_SECRET_VALUE = {
  iv: "password-iv",
  data: "encrypted-password",
}

const NAS_PASSWORD_SECRET: SecretDocType = {
  _id: "secret-nas",
  _rev: "1-secret",
  rxdbMeta: { lwt: 0 },
  rx_model: "secret",
  name: "NAS password",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  value: NAS_PASSWORD_SECRET_VALUE,
}

const NAS_USERNAME = "reader"

const toNasConnector = (host: string): WebdavConnectorDocType => ({
  id: "connector-nas",
  type: "webdav",
  url: `http://${host}/dav/`,
  username: NAS_USERNAME,
  passwordAsSecretId: NAS_PASSWORD_SECRET._id,
})

/** The NAS connector at a placeholder address, which `connectNasServer` replaces with its server's. */
const NAS_CONNECTOR = toNasConnector("nas.example.com")

/** A second connector, not connected unless a test connects it. */
const OFFICE_CONNECTOR: WebdavConnectorDocType = {
  ...NAS_CONNECTOR,
  id: "connector-office",
  url: "https://office.example.com/dav/",
}

const NAS_AUTHORIZATION = `Basic ${Buffer.from(`${NAS_USERNAME}:${NAS_PASSWORD}`).toString("base64")}`

const NAS_LINK = {
  _id: "link-nas",
  rx_model: "link",
  type: "webdav",
  data: { connectorId: NAS_CONNECTOR.id, filePath: "/books/Hyperion.epub" },
  book: "book-hyperion",
}

const UNNAMED_CONNECTOR_LINK = {
  _id: "link-unnamed-connector",
  rx_model: "link",
  type: "webdav",
  data: { filePath: "/books/Ilium.epub" },
  book: "book-unnamed-connector",
}

const OFFICE_LINK = {
  _id: "link-office",
  rx_model: "link",
  type: "webdav",
  data: { connectorId: OFFICE_CONNECTOR.id, filePath: "/reports/Q3.pdf" },
  book: "book-office",
}

const DUNE = {
  _id: "book-dune",
  rx_model: "book",
  links: [DRIVE_LINK._id],
  tags: [],
  createdAt: Date.parse("2026-01-10T08:00:00.000Z"),
  metadata: [
    { type: "link", title: "Dune [oboku~isbn~9780441013593].epub" },
    {
      type: "file",
      version: 5,
      contentType: "application/epub+zip",
      metadata: { titles: [{ value: "Dune" }] },
    },
  ],
}

const LIBRARY = {
  books: [
    DUNE,
    { ...DUNE, _id: "book-private", tags: [PROTECTED_TAG._id] },
    { ...DUNE, _id: "book-skipped", isNotInterested: true },
    { ...DUNE, _id: "book-dropbox", links: [DROPBOX_LINK._id] },
    { ...DUNE, _id: "book-mixed", links: [DROPBOX_LINK._id, DRIVE_LINK._id] },
    { ...DUNE, _id: "book-unlinked", links: [] },
    {
      ...DUNE,
      _id: "book-hyperion",
      links: [NAS_LINK._id],
      createdAt: Date.parse("2026-02-01T08:00:00.000Z"),
      metadata: [
        { type: "link", title: "Hyperion.epub" },
        {
          type: "file",
          version: 5,
          contentType: "application/epub+zip",
          metadata: { titles: [{ value: "Hyperion" }] },
        },
      ],
    },
    { ...DUNE, _id: "book-office", links: [OFFICE_LINK._id] },
    {
      ...DUNE,
      _id: "book-unnamed-connector",
      links: [UNNAMED_CONNECTOR_LINK._id],
    },
    {
      ...DUNE,
      _id: "book-blame",
      createdAt: Date.parse("2026-03-05T08:00:00.000Z"),
      metadata: [
        { type: "link", title: "BLAME! 03.cbz" },
        {
          type: "file",
          version: 5,
          contentType: "application/vnd.comicbook+zip",
          metadata: { titles: [{ value: "BLAME! 03" }] },
        },
      ],
    },
    {
      ...DUNE,
      _id: "book-arrakis",
      createdAt: Date.parse("2026-01-05T08:00:00.000Z"),
      metadata: [
        { type: "link", title: "Arrakis.epub" },
        {
          type: "file",
          version: 5,
          contentType: "application/epub+zip",
          metadata: { titles: [{ value: "Arrakis" }] },
        },
      ],
    },
  ],
  collections: [
    {
      _id: "shelf-dune",
      rx_model: "obokucollection",
      books: ["book-dune", "book-blame", "book-arrakis", "book-dropbox"],
      metadata: [{ type: "link", title: "Dune saga [oboku~series]" }],
    },
    {
      _id: "shelf-comics",
      rx_model: "obokucollection",
      books: ["book-blame"],
      metadata: [{ type: "user", title: "comics" }],
    },
    {
      _id: "shelf-blame",
      rx_model: "obokucollection",
      type: "series",
      books: ["book-blame"],
      metadata: [{ type: "link", title: "BLAME!" }],
    },
    {
      _id: "shelf-untitled",
      rx_model: "obokucollection",
      books: ["book-arrakis"],
      metadata: [],
    },
    {
      _id: "shelf-private",
      rx_model: "obokucollection",
      books: ["book-dune", "book-private"],
      metadata: [{ type: "link", title: "Private" }],
    },
    {
      _id: "shelf-unserved",
      rx_model: "obokucollection",
      books: ["book-skipped", "book-dropbox"],
      metadata: [{ type: "link", title: "Unserved" }],
    },
  ],
  links: [
    DRIVE_LINK,
    DROPBOX_LINK,
    NAS_LINK,
    OFFICE_LINK,
    UNNAMED_CONNECTOR_LINK,
  ],
  connectors: [NAS_CONNECTOR, OFFICE_CONNECTOR],
  secrets: [NAS_PASSWORD_SECRET],
  tags: [
    PROTECTED_TAG,
    { _id: "tag-reading", rx_model: "tag", isProtected: false },
  ],
}

type LibraryDocument = { _id: string }

/** Answers CouchDB's `_find`, `_all_docs` and the settings' `get` as the catalog asks them. */
const createLibraryDb = (library: {
  books: ReadonlyArray<LibraryDocument>
  collections: ReadonlyArray<LibraryDocument>
  links: ReadonlyArray<LibraryDocument>
  tags: ReadonlyArray<LibraryDocument>
  connectors: ReadonlyArray<WebdavConnectorDocType>
  secrets: ReadonlyArray<SecretDocType>
}) => {
  const documents: ReadonlyArray<LibraryDocument> = [
    ...library.books,
    ...library.collections,
    ...library.links,
    ...library.tags,
    ...library.secrets,
  ]

  return {
    get: async (id: string) => {
      if (id !== "settings")
        throw Object.assign(new Error("missing"), { statusCode: 404 })

      return { _id: "settings", connectors: library.connectors }
    },
    find: async ({
      selector,
      fields,
    }: {
      selector: Record<string, unknown>
      fields?: ReadonlyArray<string>
    }) => {
      const docs = documents
        .filter(function matchesSelector(doc) {
          const values = new Map(Object.entries(doc))

          return Object.entries(selector).every(
            ([field, value]) => values.get(field) === value,
          )
        })
        .map(function keepAskedFields(doc) {
          return fields
            ? Object.fromEntries(
                Object.entries(doc).filter(([field]) => fields.includes(field)),
              )
            : doc
        })

      return { docs, bookmark: "nil" }
    },
    fetch: async ({ keys }: { keys: ReadonlyArray<string> }) => ({
      rows: keys.map(function toRow(key) {
        const doc = documents.find(({ _id }) => _id === key)

        return doc
          ? { id: key, key, value: { rev: "1-a" }, doc }
          : { key, error: "not_found" }
      }),
    }),
  }
}

/** One more Drive book than a page lists, the newest last created. */
const LARGE_LIBRARY = {
  ...LIBRARY,
  books: Array.from({ length: 51 }, (_, index) => ({
    ...DUNE,
    _id: `book-${String(index).padStart(2, "0")}`,
    createdAt: DUNE.createdAt + index,
  })),
}

/**
 * A refusal of a streamed download as gaxios throws it: no parsed body, and
 * Drive's answer only in the message.
 */
const createDriveStreamRefusal = (status: number) =>
  Object.assign(
    new Error(
      `Request failed with status code ${status}: ${DRIVE_ACCESS_TOKEN}`,
    ),
    {
      config: { headers: { Authorization: `Bearer ${DRIVE_ACCESS_TOKEN}` } },
      response: { status },
    },
  )

/** A refusal from Drive as gaxios throws it, the access token in its config. */
const createDriveRefusal = (status: number, reason?: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    config: { headers: { Authorization: `Bearer ${DRIVE_ACCESS_TOKEN}` } },
    response: {
      status,
      data: { error: { code: status, errors: [{ reason }] } },
    },
  })

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

/**
 * A WebDAV server holding one book for the NAS connector's credentials. It
 * answers `refusalStatus` to every request instead, when set. It states no
 * size for the book unless `isSizeStated`, and sends its download chunked
 * unless `isLengthStated`.
 */
async function startWebdavServer({
  refusalStatus,
  beforeRefusal,
  isSizeStated = true,
  isLengthStated = true,
}: {
  refusalStatus?: number
  beforeRefusal?: (host: string) => Promise<unknown>
  isSizeStated?: boolean
  isLengthStated?: boolean
} = {}) {
  const requests: IncomingMessage[] = []
  const server = createServer(
    async function answerRequest(serverRequest, response) {
      requests.push(serverRequest)

      if (refusalStatus !== undefined) {
        await beforeRefusal?.(serverRequest.headers.host ?? "")
        response.writeHead(refusalStatus)
        response.end()
        return
      }

      const isSignedIn =
        serverRequest.headers.authorization === NAS_AUTHORIZATION

      if (!isSignedIn) {
        response.writeHead(401, { "www-authenticate": 'Basic realm="nas"' })
        response.end()
        return
      }

      if (serverRequest.method === "PROPFIND") {
        response.writeHead(207, {
          "content-type": "application/xml; charset=utf-8",
        })
        response.end(
          buildMultiStatusXml([
            {
              href: serverRequest.url ?? "/",
              displayName: "Hyperion.epub",
              isDirectory: false,
              size: isSizeStated ? BOOK_BYTES.length : 0,
              lastModified: new Date("2026-01-01T00:00:00.000Z"),
              mimeType: "application/epub+zip",
              etag: null,
            },
          ]),
        )
        return
      }

      response.writeHead(200, {
        "content-type": "application/epub+zip",
        ...(isLengthStated && {
          "content-length": Buffer.byteLength(BOOK_BYTES),
        }),
      })
      response.end(BOOK_BYTES)
    },
  ).listen(0, "127.0.0.1")

  onTestFinished(async function closeServer() {
    server.close()
    await once(server, "close")
  })
  await once(server, "listening")

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  return {
    host: `127.0.0.1:${address.port}`,
    requests,
    close: async () => {
      server.close()
      await once(server, "close")
    },
  }
}

describe("OpdsCatalogController", () => {
  let app: INestApplication<App>
  let connectionStore: ReturnType<typeof createConnectionStore>
  let connectionRows: Map<string, SourceConnectionPostgresEntity>
  let sourceConnectionsService: SourceConnectionsService

  const getCatalog = (path: string, authorization?: string) => {
    const pendingRequest = request(app.getHttpServer())
      .get(path)
      .set("Host", "api:3000")
      .set("X-Forwarded-Host", API_HOST)
      .set("X-Forwarded-Proto", "https")

    return authorization
      ? pendingRequest.set("Authorization", authorization)
      : pendingRequest
  }

  const createNanoInstanceForUser = vi.fn()
  const isConnected = vi.fn()
  const mintAccessToken = vi.fn()
  const getFileMetadata = vi.fn()
  const download = vi.fn()
  const deliverCover = vi.fn()
  const reserveWithinQuotas = vi.fn()
  const adjust = vi.fn()

  beforeEach(async () => {
    createNanoInstanceForUser.mockResolvedValue(createLibraryDb(LIBRARY))
    isConnected.mockResolvedValue(true)
    mintAccessToken.mockResolvedValue({
      accessToken: DRIVE_ACCESS_TOKEN,
      expiresIn: 3599,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })
    getFileMetadata.mockResolvedValue({
      modifiedAt: "2026-11-12T08:00:00.000Z",
      bookMetadata: { size: String(DRIVE_METADATA_SIZE) },
    })
    download.mockImplementation(async function streamBook() {
      return {
        stream: Readable.from([Buffer.from(BOOK_BYTES)]),
        size: BOOK_BYTES.length,
      }
    })
    reserveWithinQuotas.mockResolvedValue("reserved")
    deliverCover.mockImplementation(function deliverStoredCover() {
      return of(
        new StreamableFile(Buffer.from(COVER_BYTES), {
          disposition: "inline",
          type: "image/jpeg",
        }),
      )
    })
    adjust.mockResolvedValue(undefined)

    connectionStore = createConnectionStore()
    connectionRows = connectionStore.rows

    const module = await Test.createTestingModule({
      controllers: [OpdsCatalogController, OpdsAuthenticationController],
      providers: [
        OpdsAuthService,
        OpdsBooksService,
        OpdsBasicAuthGuard,
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
        {
          provide: GoogleConnectionService,
          useValue: { isConnected, mintAccessToken },
        },
        ConnectorConnectionService,
        SourceConnectionsService,
        AtRestCipher,
        {
          provide: SourceConnectionPostgresService,
          useValue: connectionStore.store,
        },
        { provide: PluginsService, useValue: { getFileMetadata, download } },
        { provide: CoversService, useValue: { deliverCover } },
        ProxiedDownloadQuotaService,
        {
          provide: ProxiedDownloadUsagePostgresService,
          useValue: { reserveWithinQuotas, adjust },
        },
        {
          provide: InstanceConfigService,
          useValue: {
            getConfig: () => ({
              value: {
                proxiedDownloadBytesMaxPerMonth:
                  PROXIED_DOWNLOAD_BYTES_MAX_PER_MONTH,
                proxiedDownloadUserQuota: { type: "percentage", percent: 5 },
              },
            }),
          },
        },
        { provide: OpdsServerPostgresService, useValue: serverStore },
        { provide: UserPostgresService, useValue: userStore },
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: async (token: string) => {
              if (token !== OWNER_SESSION) throw new Error("no session")

              return ownerTokenPayload
            },
          },
        },
        {
          provide: SecretsService,
          useValue: {
            getJwtPublicKey: async () => "public key",
            getJwtPrivateKey: async () => "private key",
          },
        },
      ],
    }).compile()

    sourceConnectionsService = module.get(SourceConnectionsService)
    app = module.createNestApplication({ logger: false })
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("serves the catalog root to the owner's email and the server's password", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream",
      OWNER_AUTHORIZATION,
    )

    expect(response.status).toBe(200)
    expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
      new Set([
        "application/atom+xml",
        "profile=opds-catalog",
        "kind=navigation",
        "charset=utf-8",
      ]),
    )
    expect(response.text).toContain(
      `<title>Kids' &lt;books&gt; &amp; &quot;more&quot;</title>`,
    )
    expect(response.text).toContain(
      `<link rel="start" href="/opds/calm-snails-dream" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>`,
    )
    expect(response.text).toContain(
      `<link rel="subsection" href="/opds/calm-snails-dream/books" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>`,
    )
    expect(response.text).toContain(
      `<content type="text">Every book in this catalog</content>`,
    )
    expect(response.text).toContain(
      `<link rel="subsection" href="/opds/calm-snails-dream/shelves" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>`,
    )
  })

  it("lists the Drive books the library shows, newest first", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream/books",
      OWNER_AUTHORIZATION,
    )

    expect(response.status).toBe(200)
    expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
      new Set([
        "application/atom+xml",
        "profile=opds-catalog",
        "kind=acquisition",
        "charset=utf-8",
      ]),
    )
    expect(response.text).toContain("<title>All books</title>")
    expect(response.text).toContain(
      `<link rel="start" href="/opds/calm-snails-dream" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>`,
    )
    expect(toListedBookIds(response.text)).toEqual([
      "book-blame",
      "book-dune",
      "book-arrakis",
    ])
    expect(response.text).toContain(
      `<link rel="http://opds-spec.org/acquisition" href="/opds/calm-snails-dream/books/book-dune/Dune.epub" type="application/epub+zip"/>`,
    )
    expect(response.text).toContain(
      `<link rel="http://opds-spec.org/image" href="/opds/calm-snails-dream/covers/books/book-dune" type="image/jpeg"/>`,
    )
    expect(isConnected).toHaveBeenCalledWith(OWNER.id)
    expect(createNanoInstanceForUser).toHaveBeenCalledWith({
      email: OWNER.couchName,
    })
    expect(mintAccessToken).not.toHaveBeenCalled()
    expect(getFileMetadata).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
  })

  it("lists the same books in OPDS 2.0", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream/v2/books",
      OWNER_AUTHORIZATION,
    )

    expect(response.status).toBe(200)
    expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
      new Set(["application/opds+json", "charset=utf-8"]),
    )
    expect(response.body.metadata).toEqual({
      title: "All books",
      numberOfItems: 3,
      itemsPerPage: 50,
      currentPage: 1,
    })
    expect(
      response.body.publications.map(
        (publication: { metadata: { identifier: string } }) =>
          publication.metadata.identifier,
      ),
    ).toEqual([
      "urn:oboku:opds:calm-snails-dream:books:book-blame",
      "urn:oboku:opds:calm-snails-dream:books:book-dune",
      "urn:oboku:opds:calm-snails-dream:books:book-arrakis",
    ])
  })

  it.each([
    "/opds/calm-snails-dream/books",
    "/opds/calm-snails-dream/v2/books",
  ])(
    "lists no books at %s while the owner has no Google connection",
    async (path) => {
      isConnected.mockResolvedValue(false)

      const response = await getCatalog(path, OWNER_AUTHORIZATION)

      expect(response.status).toBe(200)
      expect(response.text).not.toContain("book-dune")
      expect(createNanoInstanceForUser).not.toHaveBeenCalled()
    },
  )

  it("lists no books of an owner without a CouchDB user name", async () => {
    const response = await getCatalog(
      "/opds/quiet-owls-wait/books",
      toBasicAuthorization(`${NEWCOMER.email}:${PASSWORD}`),
    )

    expect(response.status).toBe(200)
    expect(toListedBookIds(response.text)).toEqual([])
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
  })

  describe("pages", () => {
    beforeEach(() => {
      createNanoInstanceForUser.mockResolvedValue(
        createLibraryDb(LARGE_LIBRARY),
      )
    })

    it("lists 50 books a page, linking the next", async () => {
      const response = await getCatalog(
        "/opds/calm-snails-dream/books",
        OWNER_AUTHORIZATION,
      )
      const listedBookIds = toListedBookIds(response.text)

      expect(listedBookIds).toHaveLength(50)
      expect(listedBookIds[0]).toBe("book-50")
      expect(response.text).toContain(
        `<link rel="next" href="/opds/calm-snails-dream/books?page=2" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>`,
      )
    })

    it("lists the rest on the next page", async () => {
      const response = await getCatalog(
        "/opds/calm-snails-dream/books?page=2",
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(200)
      expect(toListedBookIds(response.text)).toEqual(["book-00"])
      expect(response.text).toContain(
        `<link rel="self" href="/opds/calm-snails-dream/books?page=2" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>`,
      )
    })

    it.each([
      ["a page past the last", 404, "books?page=3"],
      ["a page past the last in OPDS 2.0", 404, "v2/books?page=3"],
      ["page 0", 400, "books?page=0"],
      ["a page that is not a number", 400, "v2/books?page=next"],
    ])("answers %s with %i", async (_, status, path) => {
      const response = await getCatalog(
        `/opds/calm-snails-dream/${path}`,
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(status)
    })
  })

  it("serves the OPDS 2.0 catalog root under v2", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream/v2",
      OWNER_AUTHORIZATION,
    )

    expect(response.status).toBe(200)
    expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
      new Set(["application/opds+json", "charset=utf-8"]),
    )
    expect(response.body).toEqual({
      metadata: { title: `Kids' <books> & "more"` },
      links: [
        {
          rel: "self",
          href: "/opds/calm-snails-dream/v2",
          type: "application/opds+json",
        },
        {
          rel: "start",
          href: "/opds/calm-snails-dream/v2",
          type: "application/opds+json",
        },
      ],
      navigation: [
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/books",
          type: "application/opds+json",
          title: "All books",
        },
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/shelves",
          type: "application/opds+json",
          title: "Shelves",
        },
      ],
    })
  })

  it.each([
    ["a server without credentials", "calm-snails-dream", undefined],
    ["an unknown server", "brave-foxes-run", undefined],
    [
      "a server with a wrong password",
      "calm-snails-dream",
      toBasicAuthorization(`${OWNER.email}:k7mq-x2fp-9dwa-hc4m`),
    ],
  ])(
    "serves the same authentication document to %s",
    async (_, slug, authorization) => {
      const response = await getCatalog(
        `/opds/${slug}/authentication`,
        authorization,
      )

      expect(response.status).toBe(200)
      expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
        new Set(["application/opds-authentication+json", "charset=utf-8"]),
      )
      expect(response.body).toEqual(toAuthenticationDocument(slug))
    },
  )

  it("gives the authentication document the scheme of the connection without a proxy", async () => {
    const response = await request(app.getHttpServer())
      .get("/opds/calm-snails-dream/authentication")
      .set("Host", API_HOST)

    expect(response.body).toEqual(
      toAuthenticationDocument("calm-snails-dream", "http"),
    )
  })

  it("accepts the owner's email in any case", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream",
      toBasicAuthorization(`Reader@Example.COM:${PASSWORD}`),
    )

    expect(response.status).toBe(200)
  })

  it.each([
    ["missing credentials", "/opds/calm-snails-dream", undefined],
    ["an app session", "/opds/calm-snails-dream", `Bearer ${OWNER_SESSION}`],
    [
      "credentials without a password",
      "/opds/calm-snails-dream",
      toBasicAuthorization(OWNER.email),
    ],
    [
      "a wrong password",
      "/opds/calm-snails-dream",
      toBasicAuthorization(`${OWNER.email}:k7mq-x2fp-9dwa-hc4m`),
    ],
    [
      "another account's email",
      "/opds/calm-snails-dream",
      toBasicAuthorization(`other@example.com:${PASSWORD}`),
    ],
    ["an unknown server", "/opds/brave-foxes-run", OWNER_AUTHORIZATION],
    [
      "missing credentials on a book's file",
      "/opds/calm-snails-dream/books/book-dune/Dune.epub",
      undefined,
    ],
    [
      "missing credentials on a book's cover",
      "/opds/calm-snails-dream/covers/books/book-dune",
      undefined,
    ],
    [
      "missing credentials on a shelf",
      "/opds/calm-snails-dream/shelves/shelf-dune",
      undefined,
    ],
    [
      "missing credentials in OPDS 2.0",
      "/opds/calm-snails-dream/v2",
      undefined,
    ],
  ])(
    "refuses %s with the same Basic challenge and authentication document",
    async (_, path, authorization) => {
      const response = await getCatalog(path, authorization)
      const slug = path.split("/")[2] ?? ""

      expect(response.status).toBe(401)
      expect(response.headers["www-authenticate"]).toBe(OPDS_CHALLENGE)
      expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
        new Set(["application/opds-authentication+json", "charset=utf-8"]),
      )
      expect(response.body).toEqual(toAuthenticationDocument(slug))
    },
  )
  describe("shelves", () => {
    it("lists the shelves from A to Z, whatever their type, with how many books each serves", async () => {
      const response = await getCatalog(
        "/opds/calm-snails-dream/shelves",
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(200)
      expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
        new Set([
          "application/atom+xml",
          "profile=opds-catalog",
          "kind=navigation",
          "charset=utf-8",
        ]),
      )
      expect(toListedShelfIds(response.text)).toEqual([
        "shelf-blame",
        "shelf-comics",
        "shelf-dune",
        "shelf-untitled",
      ])
      expect(response.text).toContain(`<title>Dune saga</title>`)
      expect(response.text).toContain(`<title>Untitled shelf</title>`)
      expect(response.text).toContain(`<content type="text">3 books</content>`)
      expect(response.text).toContain(`<content type="text">1 book</content>`)
      expect(response.text).toContain(
        `<link rel="subsection" href="/opds/calm-snails-dream/shelves/shelf-dune" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>`,
      )
    })

    it("lists the same shelves in OPDS 2.0, with their books' count", async () => {
      const response = await getCatalog(
        "/opds/calm-snails-dream/v2/shelves",
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(200)
      expect(response.body.metadata).toEqual({
        title: "Shelves",
        numberOfItems: 4,
        itemsPerPage: 50,
        currentPage: 1,
      })
      expect(response.body.navigation).toEqual([
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/shelves/shelf-blame",
          type: "application/opds+json",
          title: "BLAME!",
          properties: { numberOfItems: 1 },
        },
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/shelves/shelf-comics",
          type: "application/opds+json",
          title: "comics",
          properties: { numberOfItems: 1 },
        },
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/shelves/shelf-dune",
          type: "application/opds+json",
          title: "Dune saga",
          properties: { numberOfItems: 3 },
        },
        {
          rel: "subsection",
          href: "/opds/calm-snails-dream/v2/shelves/shelf-untitled",
          type: "application/opds+json",
          title: "Untitled shelf",
          properties: { numberOfItems: 1 },
        },
      ])
    })

    it.each([
      "/opds/calm-snails-dream/shelves/shelf-dune",
      "/opds/calm-snails-dream/v2/shelves/shelf-dune",
    ])("lists a shelf's served books from A to Z at %s", async (path) => {
      const response = await getCatalog(path, OWNER_AUTHORIZATION)
      const listedBookIds = path.includes("/v2/")
        ? response.body.publications.map(
            (publication: { metadata: { identifier: string } }) =>
              publication.metadata.identifier.split(":").at(-1),
          )
        : toListedBookIds(response.text)

      expect(response.status).toBe(200)
      expect(listedBookIds).toEqual(["book-arrakis", "book-blame", "book-dune"])
    })

    it("titles a shelf's feed after the shelf", async () => {
      const response = await getCatalog(
        "/opds/calm-snails-dream/shelves/shelf-dune",
        OWNER_AUTHORIZATION,
      )

      expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
        new Set([
          "application/atom+xml",
          "profile=opds-catalog",
          "kind=acquisition",
          "charset=utf-8",
        ]),
      )
      expect(response.text).toContain(
        `  <id>urn:oboku:opds:calm-snails-dream:shelves:shelf-dune</id>\n  <title>Dune saga</title>`,
      )
      expect(response.text).toContain(
        `<link rel="self" href="/opds/calm-snails-dream/shelves/shelf-dune" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>`,
      )
    })

    it.each([
      ["a shelf holding a book under a protected tag", "shelf-private"],
      ["a shelf without a served book", "shelf-unserved"],
      ["an unknown shelf", "shelf-missing"],
    ])("answers 404 for %s", async (_, shelfId) => {
      const response = await getCatalog(
        `/opds/calm-snails-dream/shelves/${shelfId}`,
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(404)
    })

    it("lists no shelf and serves none while the owner has no Google connection", async () => {
      isConnected.mockResolvedValue(false)

      const shelves = await getCatalog(
        "/opds/calm-snails-dream/shelves",
        OWNER_AUTHORIZATION,
      )
      const shelf = await getCatalog(
        "/opds/calm-snails-dream/shelves/shelf-dune",
        OWNER_AUTHORIZATION,
      )

      expect(shelves.status).toBe(200)
      expect(toListedShelfIds(shelves.text)).toEqual([])
      expect(shelf.status).toBe(404)
      expect(createNanoInstanceForUser).not.toHaveBeenCalled()
    })

    it.each([
      ["a page past the last", 404, "shelves?page=2"],
      ["a shelf's page past the last", 404, "shelves/shelf-dune?page=2"],
      ["page 0", 400, "shelves?page=0"],
      ["a shelf's page 0 in OPDS 2.0", 400, "v2/shelves/shelf-dune?page=0"],
    ])("answers %s with %i", async (_, status, path) => {
      const response = await getCatalog(
        `/opds/calm-snails-dream/${path}`,
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(status)
    })
  })

  describe("book covers", () => {
    const getBookCover = (bookId: string) =>
      getCatalog(
        `/opds/calm-snails-dream/covers/books/${bookId}?hash=1767254400000`,
        OWNER_AUTHORIZATION,
      ).responseType("blob")

    it("serves a served book's cover as JPEG, found under the owner's CouchDB user name", async () => {
      const response = await getBookCover("book-dune")

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("image/jpeg")
      expect(response.headers["cache-control"]).toBe(
        "private, max-age=31536000, immutable",
      )
      expect(response.body.toString()).toBe(COVER_BYTES)
      expect(deliverCover).toHaveBeenCalledWith(
        getBookCoverKey(emailToNameHex("Reader@Example.com"), "book-dune"),
        "image/jpeg",
      )
    })

    it("asks neither Google nor the download quota", async () => {
      await getBookCover("book-dune")

      expect(mintAccessToken).not.toHaveBeenCalled()
      expect(getFileMetadata).not.toHaveBeenCalled()
      expect(reserveWithinQuotas).not.toHaveBeenCalled()
    })

    it.each([
      ["an unknown book", "book-missing"],
      ["a book under a protected tag", "book-private"],
      ["a book marked not interested", "book-skipped"],
      ["a book on another provider", "book-dropbox"],
      ["a book whose Drive link is not its first", "book-mixed"],
      ["a book without links", "book-unlinked"],
    ])("answers 404 for %s, sending no cover", async (_, bookId) => {
      const response = await getBookCover(bookId)

      expect(response.status).toBe(404)
      expect(response.headers["cache-control"]).toBeUndefined()
      expect(deliverCover).not.toHaveBeenCalled()
    })

    it("serves no cover while the owner has no Google connection, as the catalog lists no books", async () => {
      isConnected.mockResolvedValue(false)

      const response = await getBookCover("book-dune")

      expect(response.status).toBe(404)
      expect(isConnected).toHaveBeenCalledWith(OWNER.id)
      expect(deliverCover).not.toHaveBeenCalled()
    })

    it("serves no cover of an owner without a CouchDB user name", async () => {
      const response = await getCatalog(
        "/opds/quiet-owls-wait/covers/books/book-dune",
        toBasicAuthorization(`${NEWCOMER.email}:${PASSWORD}`),
      )

      expect(response.status).toBe(404)
      expect(deliverCover).not.toHaveBeenCalled()
    })
  })

  describe("book files", () => {
    const getBookFile = (bookId: string, slug = SERVER.slug) =>
      getCatalog(
        `/opds/${slug}/books/${bookId}/Dune.epub`,
        OWNER_AUTHORIZATION,
      ).responseType("blob")

    it("streams a served book's Drive file, typed and named for reading apps", async () => {
      const response = await getBookFile("book-dune")

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("application/epub+zip")
      expect(response.headers["content-disposition"]).toBe(
        "attachment; filename=Dune.epub",
      )
      expect(response.headers["content-length"]).toBe(String(BOOK_BYTES.length))
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(createNanoInstanceForUser).toHaveBeenCalledWith({
        email: OWNER.couchName,
      })
      expect(mintAccessToken).toHaveBeenCalledWith(OWNER.id)
      expect(download).toHaveBeenCalledWith({
        link: expect.objectContaining({ _id: DRIVE_LINK._id }),
        providerCredentials: { access_token: DRIVE_ACCESS_TOKEN },
      })
    })

    it("states no length when Drive's download states none", async () => {
      download.mockResolvedValue({
        stream: Readable.from([Buffer.from(BOOK_BYTES)]),
      })

      const response = await getBookFile("book-dune")

      expect(response.status).toBe(200)
      expect(response.headers["content-length"]).toBeUndefined()
      expect(response.body.toString()).toBe(BOOK_BYTES)
    })

    it("sends the book's own media type, not the one its extension suggests", async () => {
      const response = await getBookFile("book-blame")

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe(
        "application/vnd.comicbook+zip",
      )
      expect(response.headers["content-disposition"]).toBe(
        'attachment; filename="BLAME! 03.cbz"',
      )
    })

    it.each([
      ["an unknown book", "book-missing"],
      ["a book under a protected tag", "book-private"],
      ["a book marked not interested", "book-skipped"],
      ["a book on another provider", "book-dropbox"],
      ["a book whose Drive link is not its first", "book-mixed"],
      ["a book without links", "book-unlinked"],
    ])("answers 404 for %s, without asking Google", async (_, bookId) => {
      const response = await getBookFile(bookId)

      expect(response.status).toBe(404)
      expect(mintAccessToken).not.toHaveBeenCalled()
    })

    it("serves no file of an owner without a CouchDB user name", async () => {
      const response = await getCatalog(
        "/opds/quiet-owls-wait/books/book-dune/Dune.epub",
        toBasicAuthorization(`${NEWCOMER.email}:${PASSWORD}`),
      )

      expect(response.status).toBe(404)
      expect(createNanoInstanceForUser).not.toHaveBeenCalled()
    })

    it.each([
      [
        "no Google connection",
        404,
        createObokuBadRequest(
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND,
        ),
      ],
      [
        "a lost Google connection",
        404,
        createObokuBadRequest(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST),
      ],
      [
        "an instance without Google's client secret",
        404,
        createObokuBadRequest(
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
        ),
      ],
      [
        "Google failing to refresh the token",
        502,
        new Error("Google refused to refresh the access token: internal"),
      ],
    ])("answers %s with %i", async (_, status, mintFailure) => {
      mintAccessToken.mockRejectedValue(mintFailure)

      const response = await getBookFile("book-dune")

      expect(response.status).toBe(status)
      expect(download).not.toHaveBeenCalled()
    })

    it.each([
      ["a file Drive cannot find", 404, createDriveRefusal(404, "notFound")],
      [
        "a file the token may not read",
        404,
        createDriveRefusal(403, "insufficientFilePermissions"),
      ],
      [
        "Drive's rate limit",
        503,
        createDriveRefusal(403, "userRateLimitExceeded"),
      ],
      ["too many requests", 503, createDriveRefusal(429)],
      ["a token Drive refuses", 502, createDriveRefusal(401, "authError")],
      ["a failing Drive", 502, createDriveRefusal(500, "backendError")],
    ])(
      "answers %s with %i, keeping the access token out",
      async (_, status, refusal) => {
        const warn = vi.spyOn(Logger.prototype, "warn")
        getFileMetadata.mockRejectedValue(refusal)

        const response = await getBookFile("book-dune")

        expect(response.status).toBe(status)
        expect(JSON.stringify(response.headers)).not.toContain(
          DRIVE_ACCESS_TOKEN,
        )
        expect(response.body.toString()).not.toContain(DRIVE_ACCESS_TOKEN)
        expect(JSON.stringify(warn.mock.calls)).not.toContain(
          DRIVE_ACCESS_TOKEN,
        )
      },
    )

    it.each([
      ["a download limit once the file's metadata came", 503, 403],
      ["a file gone between both requests", 404, 404],
      ["a failing download", 502, 500],
    ])(
      "answers %s with %i, though gaxios keeps no body of a stream",
      async (_, status, driveStatus) => {
        const warn = vi.spyOn(Logger.prototype, "warn")
        download.mockRejectedValue(createDriveStreamRefusal(driveStatus))

        const response = await getBookFile("book-dune")

        expect(response.status).toBe(status)
        expect(JSON.stringify(warn.mock.calls)).not.toContain(
          DRIVE_ACCESS_TOKEN,
        )
      },
    )

    describe("monthly proxied download quota", () => {
      const NOVEMBER = "2026-11-01"

      beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-11-14T21:00:00.000Z"))
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it("reserves the length Drive's download states, and keeps it once the whole file is sent", async () => {
        const response = await getBookFile("book-dune")

        expect(response.status).toBe(200)
        expect(response.body.toString()).toBe(BOOK_BYTES)
        expect(reserveWithinQuotas).toHaveBeenCalledWith({
          userId: OWNER.id,
          month: NOVEMBER,
          bytes: BOOK_BYTES.length,
          quotaBytes: PROXIED_DOWNLOAD_BYTES_MAX_PER_MONTH,
          userQuotaBytes: PROXIED_DOWNLOAD_USER_QUOTA_BYTES,
        })
        expect(adjust).not.toHaveBeenCalled()
      })

      it("answers 429 until the next month once the download would pass the quota", async () => {
        vi.setSystemTime(new Date("2026-12-31T23:30:00.000Z"))
        reserveWithinQuotas.mockResolvedValue("quota-reached")
        const driveStream = Readable.from([Buffer.from(BOOK_BYTES)])
        download.mockResolvedValue({
          stream: driveStream,
          size: BOOK_BYTES.length,
        })

        const response = await getBookFile("book-dune")

        expect(response.status).toBe(429)
        expect(response.headers["retry-after"]).toBe(
          "Fri, 01 Jan 2027 00:00:00 GMT",
        )
        expect(response.headers["content-disposition"]).toBeUndefined()
        expect(driveStream.destroyed).toBe(true)
      })

      it("gives the whole reservation back for a HEAD request", async () => {
        const response = await request(app.getHttpServer())
          .head(`/opds/${SERVER.slug}/books/book-dune/Dune.epub`)
          .set("Authorization", OWNER_AUTHORIZATION)

        expect(response.status).toBe(200)
        await vi.waitFor(() =>
          expect(adjust).toHaveBeenCalledWith({
            userId: OWNER.id,
            month: NOVEMBER,
            bytes: -BOOK_BYTES.length,
          }),
        )
      })

      it("answers 502 and gives the reservation back when Drive fails while the reservation waits", async () => {
        const driveStream = new Readable({ read() {} })
        download.mockResolvedValue({
          stream: driveStream,
          size: BOOK_BYTES.length,
        })
        reserveWithinQuotas.mockImplementation(
          async function failDriveWhileReserving() {
            const driveClosed = new Promise(function waitForClose(resolve) {
              driveStream.once("close", resolve)
            })

            driveStream.destroy(new Error("socket hang up"))
            await driveClosed

            return "reserved"
          },
        )

        const response = await getBookFile("book-dune")

        expect(response.status).toBe(502)
        await vi.waitFor(() =>
          expect(adjust).toHaveBeenCalledWith({
            userId: OWNER.id,
            month: NOVEMBER,
            bytes: -BOOK_BYTES.length,
          }),
        )
      })

      it.each([
        [
          "Drive's file metadata size",
          { size: String(DRIVE_METADATA_SIZE) },
          DRIVE_METADATA_SIZE,
        ],
        ["nothing when Drive states no size", {}, 0],
        ["nothing when Drive's size is not a byte count", { size: "12 kB" }, 0],
      ])(
        "reserves %s when Drive's download states no length, then counts the bytes sent",
        async (_, bookMetadata, reservedBytes) => {
          getFileMetadata.mockResolvedValue({
            modifiedAt: "2026-11-12T08:00:00.000Z",
            bookMetadata,
          })
          download.mockResolvedValue({
            stream: Readable.from([Buffer.from(BOOK_BYTES)]),
          })

          const response = await getBookFile("book-dune")

          expect(response.status).toBe(200)
          expect(reserveWithinQuotas).toHaveBeenCalledWith(
            expect.objectContaining({ bytes: reservedBytes }),
          )
          await vi.waitFor(() =>
            expect(adjust).toHaveBeenCalledWith({
              userId: OWNER.id,
              month: NOVEMBER,
              bytes: BOOK_BYTES.length - reservedBytes,
            }),
          )
        },
      )
    })

    it("answers 502 when Drive's stream fails before its first byte", async () => {
      download.mockResolvedValue({
        stream: new Readable({
          read() {
            this.destroy(new Error("socket hang up"))
          },
        }),
      })

      const response = await getBookFile("book-dune")

      expect(response.status).toBe(502)
      await vi.waitFor(() =>
        expect(adjust).toHaveBeenCalledWith(
          expect.objectContaining({ bytes: -DRIVE_METADATA_SIZE }),
        ),
      )
    })
  })
  describe("WebDAV connectors", () => {
    const toRowKey = (connectorId: string) =>
      toConnectionRowKey({
        userId: OWNER.id,
        provider: "webdav",
        accountId: connectorId,
      })

    const connectConnector = (connector: WebdavConnectorDocType) =>
      sourceConnectionsService.connect({
        userId: OWNER.id,
        provider: "webdav",
        credentials: {
          connector,
          passwordSecretValue: NAS_PASSWORD_SECRET_VALUE,
          password: NAS_PASSWORD,
        },
        accountId: connector.id,
        accountName: connector.url,
        scopes: [],
      })

    const setConnectors = (connectors: WebdavConnectorDocType[]) => {
      createNanoInstanceForUser.mockResolvedValue(
        createLibraryDb({ ...LIBRARY, connectors }),
      )
    }

    const connectNasServer = async (
      options?: Parameters<typeof startWebdavServer>[0],
    ) => {
      const nas = await startWebdavServer(options)
      const nasConnector = toNasConnector(nas.host)
      setPrivateNetworkAllowedHosts([nas.host])
      setConnectors([nasConnector, OFFICE_CONNECTOR])
      await connectConnector(nasConnector)

      return { ...nas, nasConnector }
    }

    const getBookFile = (bookId: string) =>
      getCatalog(
        `/opds/${SERVER.slug}/books/${bookId}/Hyperion.epub`,
        OWNER_AUTHORIZATION,
      ).responseType("blob")

    afterEach(() => {
      setPrivateNetworkAllowedHosts([])
    })

    it("lists the books of a connected connector with the Drive books, and none of a connector not connected or of a link that names none", async () => {
      await connectNasServer()

      const response = await getCatalog(
        "/opds/calm-snails-dream/books",
        OWNER_AUTHORIZATION,
      )

      expect(response.status).toBe(200)
      expect(toListedBookIds(response.text)).toEqual([
        "book-blame",
        "book-hyperion",
        "book-dune",
        "book-arrakis",
      ])
    })

    it("lists the books of a connected connector while Google is not connected", async () => {
      isConnected.mockResolvedValue(false)
      await connectNasServer()

      const response = await getCatalog(
        "/opds/calm-snails-dream/books",
        OWNER_AUTHORIZATION,
      )

      expect(toListedBookIds(response.text)).toEqual(["book-hyperion"])
    })

    it("lists and serves no book of a connector changed since it was connected, and keeps its connection", async () => {
      const { nasConnector, requests } = await connectNasServer()
      setConnectors([{ ...nasConnector, username: "admin" }, OFFICE_CONNECTOR])

      const listing = await getCatalog(
        "/opds/calm-snails-dream/books",
        OWNER_AUTHORIZATION,
      )
      const download = await getBookFile("book-hyperion")

      expect(toListedBookIds(listing.text)).not.toContain("book-hyperion")
      expect(download.status).toBe(404)
      expect(requests).toEqual([])
      expect(connectionRows.has(toRowKey(nasConnector.id))).toBe(true)
    })

    it("deletes the connection of a connector the settings no longer hold, once a reading app opens the catalog", async () => {
      const { nasConnector } = await connectNasServer()
      setConnectors([OFFICE_CONNECTOR])

      const response = await getCatalog(
        "/opds/calm-snails-dream/books",
        OWNER_AUTHORIZATION,
      )

      expect(toListedBookIds(response.text)).not.toContain("book-hyperion")
      expect(connectionRows.has(toRowKey(nasConnector.id))).toBe(false)
    })

    it("streams a book from the connector's server with the kept password, reserving the size the server states", async () => {
      const { requests } = await connectNasServer()

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("application/epub+zip")
      expect(response.headers["content-disposition"]).toBe(
        "attachment; filename=Hyperion.epub",
      )
      expect(response.headers["content-length"]).toBe(String(BOOK_BYTES.length))
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(
        requests.map(({ method, url, headers }) => ({
          method,
          url,
          authorization: headers.authorization,
        })),
      ).toEqual([
        {
          method: "PROPFIND",
          url: "/dav/books/Hyperion.epub",
          authorization: NAS_AUTHORIZATION,
        },
        {
          method: "GET",
          url: "/dav/books/Hyperion.epub",
          authorization: NAS_AUTHORIZATION,
        },
      ])
      expect(reserveWithinQuotas).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER.id, bytes: BOOK_BYTES.length }),
      )
      expect(mintAccessToken).not.toHaveBeenCalled()
    })

    it("states no length when the server's download states none, reserving the size its metadata states", async () => {
      await connectNasServer({ isLengthStated: false })

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(200)
      expect(response.headers["content-length"]).toBeUndefined()
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(reserveWithinQuotas).toHaveBeenCalledWith(
        expect.objectContaining({ bytes: BOOK_BYTES.length }),
      )
    })

    it("sends the password only to the address the connector was connected with, though the settings change right after its checks", async () => {
      const { host, nasConnector, requests } = await connectNasServer()
      const otherServer = await startWebdavServer()
      setPrivateNetworkAllowedHosts([host, otherServer.host])
      const libraryDb = createLibraryDb({
        ...LIBRARY,
        connectors: [nasConnector, OFFICE_CONNECTOR],
      })
      const movedLibraryDb = createLibraryDb({
        ...LIBRARY,
        connectors: [
          { ...nasConnector, url: `http://${otherServer.host}/dav/` },
          OFFICE_CONNECTOR,
        ],
      })
      const readSettings = vi
        .fn()
        .mockImplementationOnce(libraryDb.get)
        .mockImplementationOnce(libraryDb.get)
        .mockImplementation(movedLibraryDb.get)
      createNanoInstanceForUser.mockResolvedValue({
        ...libraryDb,
        get: readSettings,
      })

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(200)
      expect(readSettings).toHaveBeenCalledTimes(2)
      expect(requests).toHaveLength(2)
      expect(otherServer.requests).toEqual([])
    })

    it("serves no file when the settings change between the catalog's checks and the download, contacting no server", async () => {
      const { host, nasConnector, requests } = await connectNasServer()
      const otherServer = await startWebdavServer()
      setPrivateNetworkAllowedHosts([host, otherServer.host])
      const libraryDb = createLibraryDb({
        ...LIBRARY,
        connectors: [nasConnector, OFFICE_CONNECTOR],
      })
      const movedLibraryDb = createLibraryDb({
        ...LIBRARY,
        connectors: [
          { ...nasConnector, url: `http://${otherServer.host}/dav/` },
          OFFICE_CONNECTOR,
        ],
      })
      createNanoInstanceForUser.mockResolvedValue({
        ...libraryDb,
        get: vi
          .fn()
          .mockImplementationOnce(libraryDb.get)
          .mockImplementation(movedLibraryDb.get),
      })

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(404)
      expect(requests).toEqual([])
      expect(otherServer.requests).toEqual([])
    })

    it("serves no file of a connector the owner did not connect", async () => {
      await connectNasServer()

      const response = await getBookFile("book-office")

      expect(response.status).toBe(404)
    })

    it("deletes the connection when the server refuses the password, answering 404, and keeps the owner's other connections", async () => {
      const warn = vi.spyOn(Logger.prototype, "warn")
      const { nasConnector } = await connectNasServer({ refusalStatus: 401 })
      await connectConnector(OFFICE_CONNECTOR)

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(404)
      expect(connectionRows.has(toRowKey(nasConnector.id))).toBe(false)
      expect(connectionRows.has(toRowKey(OFFICE_CONNECTOR.id))).toBe(true)
      expect(JSON.stringify(warn.mock.calls)).not.toContain(NAS_PASSWORD)
    })

    it("keeps the connection the user made again while the server refused the password it replaced", async () => {
      vi.useFakeTimers({ toFake: ["Date"] })
      onTestFinished(function restoreClock() {
        vi.useRealTimers()
      })
      vi.setSystemTime(new Date("2026-11-18T10:00:00.000Z"))
      const reconnectedAt = new Date("2026-11-18T10:05:00.000Z")
      const warn = vi.spyOn(Logger.prototype, "warn")
      const connectAgain = vi.fn(function connectAgainLater(host: string) {
        vi.setSystemTime(reconnectedAt)

        return connectConnector(toNasConnector(host))
      })
      const { nasConnector } = await connectNasServer({
        refusalStatus: 401,
        beforeRefusal: connectAgain,
      })

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(404)
      expect(connectAgain).toHaveBeenCalledTimes(1)
      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining("Disconnected connector"),
      )
      expect(connectionRows.get(toRowKey(nasConnector.id))?.updated_at).toEqual(
        reconnectedAt,
      )
    })

    it("answers 500 and logs the failure when the refused password cannot be forgotten", async () => {
      const logError = vi.spyOn(Logger.prototype, "error")
      const deleteFailure = new Error("Postgres is unreachable")
      await connectNasServer({ refusalStatus: 401 })
      vi.spyOn(connectionStore.store, "deleteIfUnchanged").mockRejectedValue(
        deleteFailure,
      )

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(500)
      expect(logError).toHaveBeenCalledWith(deleteFailure)
    })

    it.each([
      ["a file the account may not read", 403, 404],
      ["a file the server cannot find", 404, 404],
      ["too many requests", 429, 503],
      ["a failing server", 500, 502],
    ])(
      "answers %s with %i, keeping the connection",
      async (_, refusalStatus, status) => {
        const { nasConnector } = await connectNasServer({ refusalStatus })

        const response = await getBookFile("book-hyperion")

        expect(response.status).toBe(status)
        expect(connectionRows.has(toRowKey(nasConnector.id))).toBe(true)
      },
    )

    it("answers 502 for a server that cannot be reached, keeping the connection", async () => {
      const { nasConnector, close } = await connectNasServer()
      await close()

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(502)
      expect(connectionRows.has(toRowKey(nasConnector.id))).toBe(true)
    })

    it("answers 502 for a file whose size the server does not state, without downloading it", async () => {
      const { requests } = await connectNasServer({ isSizeStated: false })

      const response = await getBookFile("book-hyperion")

      expect(response.status).toBe(502)
      expect(requests.map(({ method }) => method)).toEqual(["PROPFIND"])
    })

    it("serves the cover of a connected connector's book without asking its server, and none of a connector not connected", async () => {
      const { requests } = await connectNasServer()
      const coverOf = (bookId: string) =>
        getCatalog(
          `/opds/calm-snails-dream/covers/books/${bookId}?hash=1767254400000`,
          OWNER_AUTHORIZATION,
        )

      const servedCover = await coverOf("book-hyperion")
      const unservedCover = await coverOf("book-office")

      expect(servedCover.status).toBe(200)
      expect(unservedCover.status).toBe(404)
      expect(deliverCover).toHaveBeenCalledTimes(1)
      expect(requests).toEqual([])
    })
  })
})
