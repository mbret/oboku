import { Readable } from "node:stream"
import { type INestApplication, Logger, StreamableFile } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { getBookCoverKey, ObokuErrorCode } from "@oboku/shared"
import { Test } from "@nestjs/testing"
import { of } from "rxjs"
import request from "supertest"
import type { App } from "supertest/types.js"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { hashSecret } from "../crypto/secretHash.js"
import type {
  OpdsServerPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { createObokuBadRequest } from "../http/obokuBadRequest.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
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
  ],
  links: [DRIVE_LINK, DROPBOX_LINK],
  tags: [
    PROTECTED_TAG,
    { _id: "tag-reading", rx_model: "tag", isProtected: false },
  ],
}

type LibraryDocument = { _id: string }

/** Answers CouchDB's `_find` and `_all_docs` as the catalog asks them. */
const createLibraryDb = (library: {
  books: ReadonlyArray<LibraryDocument>
  links: ReadonlyArray<LibraryDocument>
  tags: ReadonlyArray<LibraryDocument>
}) => {
  const documents = [...library.books, ...library.links, ...library.tags]

  return {
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

describe("OpdsCatalogController", () => {
  let app: INestApplication<App>

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
          useValue: { getJwtPublicKey: async () => "public key" },
        },
      ],
    }).compile()

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
    expect(toListedBookIds(response.text)).toEqual(["book-blame", "book-dune"])
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
      numberOfItems: 2,
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
})
