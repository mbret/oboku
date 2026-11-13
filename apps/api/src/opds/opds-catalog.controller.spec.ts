import { Readable } from "node:stream"
import { type INestApplication, Logger } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { ObokuErrorCode } from "@oboku/shared"
import { Test } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService } from "../couch/couch.service.js"
import { hashSecret } from "../crypto/secretHash.js"
import type {
  OpdsServerPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { createObokuBadRequest } from "../http/obokuBadRequest.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { GoogleConnectionService } from "../provider-connections/google/google-connection.service.js"
import { OpdsAuthenticationController } from "./opds-authentication.controller.js"
import { OpdsBasicAuthGuard } from "./opds-basic-auth.guard.js"
import { OpdsCatalogController } from "./opds-catalog.controller.js"
import { OpdsCatalogService } from "./opds-catalog.service.js"
import { OpdsLibraryService } from "./opds-library.service.js"

const OWNER: UserPostgresEntity = {
  id: 1,
  email: "reader@example.com",
  username: "reader@example.com",
  couchName: "reader@example.com",
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

/** Answers CouchDB's `_find` for the selectors the catalog sends. */
const libraryDb = {
  find: async ({ selector }: { selector: Record<string, unknown> }) => {
    const docs = [...LIBRARY.books, ...LIBRARY.links, ...LIBRARY.tags].filter(
      function matchesSelector(doc) {
        const fields = new Map(Object.entries(doc))

        return Object.entries(selector).every(
          ([field, value]) => fields.get(field) === value,
        )
      },
    )

    return { docs, bookmark: "nil" }
  },
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
  const mintAccessToken = vi.fn()
  const getFileMetadata = vi.fn()
  const download = vi.fn()

  beforeEach(async () => {
    createNanoInstanceForUser.mockResolvedValue(libraryDb)
    mintAccessToken.mockResolvedValue({
      accessToken: DRIVE_ACCESS_TOKEN,
      expiresIn: 3599,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })
    getFileMetadata.mockResolvedValue({
      modifiedAt: "2026-11-12T08:00:00.000Z",
      bookMetadata: { size: String(BOOK_BYTES.length) },
    })
    download.mockImplementation(async function streamBook() {
      return { stream: Readable.from([Buffer.from(BOOK_BYTES)]) }
    })

    const module = await Test.createTestingModule({
      controllers: [OpdsCatalogController, OpdsAuthenticationController],
      providers: [
        OpdsCatalogService,
        OpdsLibraryService,
        OpdsBasicAuthGuard,
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
        { provide: GoogleConnectionService, useValue: { mintAccessToken } },
        { provide: PluginsService, useValue: { getFileMetadata, download } },
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

  it("lists no books yet", async () => {
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
    expect(response.text).not.toContain("<entry>")
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

  it("lists no books yet in OPDS 2.0", async () => {
    const response = await getCatalog(
      "/opds/calm-snails-dream/v2/books",
      OWNER_AUTHORIZATION,
    )

    expect(response.status).toBe(200)
    expect(toMediaTypeParts(response.headers["content-type"])).toEqual(
      new Set(["application/opds+json", "charset=utf-8"]),
    )
    expect(response.body).toEqual({
      metadata: { title: "All books" },
      links: [
        {
          rel: "self",
          href: "/opds/calm-snails-dream/v2/books",
          type: "application/opds+json",
        },
        {
          rel: "start",
          href: "/opds/calm-snails-dream/v2",
          type: "application/opds+json",
        },
      ],
      publications: [],
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

    it("serves no file of an owner whose library it cannot open yet", async () => {
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
        createObokuBadRequest(
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND,
        ),
        404,
      ],
      [
        "a lost Google connection",
        createObokuBadRequest(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST),
        404,
      ],
      [
        "an instance without Google's client secret",
        createObokuBadRequest(
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
        ),
        404,
      ],
      [
        "Google failing to refresh the token",
        new Error("Google refused to refresh the access token: internal"),
        502,
      ],
    ])("answers %s with %i", async (_, mintFailure, status) => {
      mintAccessToken.mockRejectedValue(mintFailure)

      const response = await getBookFile("book-dune")

      expect(response.status).toBe(status)
      expect(download).not.toHaveBeenCalled()
    })

    it.each([
      ["a file Drive cannot find", createDriveRefusal(404, "notFound"), 404],
      [
        "a file the token may not read",
        createDriveRefusal(403, "insufficientFilePermissions"),
        404,
      ],
      [
        "Drive's rate limit",
        createDriveRefusal(403, "userRateLimitExceeded"),
        503,
      ],
      ["too many requests", createDriveRefusal(429), 503],
      ["a token Drive refuses", createDriveRefusal(401, "authError"), 502],
      ["a failing Drive", createDriveRefusal(500, "backendError"), 502],
    ])(
      "answers %s with %i, keeping the access token out",
      async (_, refusal, status) => {
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
      ["a download limit once the file's metadata came", 403, 503],
      ["a file gone between both requests", 404, 404],
      ["a failing download", 500, 502],
    ])(
      "answers %s with %i, though gaxios keeps no body of a stream",
      async (_, driveStatus, status) => {
        const warn = vi.spyOn(Logger.prototype, "warn")
        download.mockRejectedValue(createDriveStreamRefusal(driveStatus))

        const response = await getBookFile("book-dune")

        expect(response.status).toBe(status)
        expect(JSON.stringify(warn.mock.calls)).not.toContain(
          DRIVE_ACCESS_TOKEN,
        )
      },
    )

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
    })
  })
})
