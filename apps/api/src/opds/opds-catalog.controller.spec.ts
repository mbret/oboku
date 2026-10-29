import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import request from "supertest"
import type { App } from "supertest/types.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { hashSecret } from "../crypto/secretHash.js"
import type {
  OpdsServerPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { OpdsBasicAuthGuard } from "./opds-basic-auth.guard.js"
import { OpdsCatalogController } from "./opds-catalog.controller.js"
import { OpdsCatalogService } from "./opds-catalog.service.js"

const OWNER: UserPostgresEntity = {
  id: 1,
  email: "reader@example.com",
  username: "reader@example.com",
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

const ownerTokenPayload: TokenPayload = {
  name: OWNER.email,
  sub: OWNER.email,
  userId: OWNER.id,
  "couchdb.roles": [],
}

const OPDS_CHALLENGE = 'Basic realm="oboku-opds", charset="UTF-8"'

/** Express adds a charset and sorts the parameters, which leaves the type the same. */
const toMediaTypeParts = (contentType: string | undefined) =>
  new Set(contentType?.split(";").map((part) => part.trim()))

const toBasicAuthorization = (credentials: string) =>
  `Basic ${Buffer.from(credentials, "utf8").toString("base64")}`

const OWNER_AUTHORIZATION = toBasicAuthorization(`${OWNER.email}:${PASSWORD}`)

const serverStore: Pick<OpdsServerPostgresService, "findBySlug"> = {
  findBySlug: async (slug) => (slug === SERVER.slug ? SERVER : null),
}

const userStore: Pick<UserPostgresService, "findById"> = {
  findById: async (userId) => (userId === OWNER.id ? OWNER : null),
}

describe("OpdsCatalogController", () => {
  let app: INestApplication<App>

  const getCatalog = (path: string, authorization?: string) => {
    const pendingRequest = request(app.getHttpServer()).get(path)

    return authorization
      ? pendingRequest.set("Authorization", authorization)
      : pendingRequest
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OpdsCatalogController],
      providers: [
        OpdsCatalogService,
        OpdsBasicAuthGuard,
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
  ])(
    "refuses %s with the same Basic challenge",
    async (_, path, authorization) => {
      const response = await getCatalog(path, authorization)

      expect(response.status).toBe(401)
      expect(response.headers["www-authenticate"]).toBe(OPDS_CHALLENGE)
      expect(response.body).toEqual({
        message: "Unauthorized",
        statusCode: 401,
      })
    },
  )
})
