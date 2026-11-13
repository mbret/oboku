import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import { inspect } from "node:util"
import { BehaviorSubject } from "rxjs"
import request from "supertest"
import type { App } from "supertest/types.js"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../../auth/auth.guard.js"
import { SecretsService } from "../../config/SecretsService.js"
import { AtRestCipher } from "../../crypto/at-rest-cipher.js"
import type { ProviderConnectionPostgresEntity } from "../../features/postgres/entities.js"
import { ProviderConnectionPostgresService } from "../../features/postgres/provider-connection-postgres.service.js"
import { createConnectionStore } from "../provider-connection-store.fixture.js"
import { ProviderConnectionsService } from "../provider-connections.service.js"
import { GoogleConnectionController } from "./google-connection.controller.js"
import { GoogleConnectionService } from "./google-connection.service.js"

const {
  createOAuth2Client,
  getToken,
  verifyIdToken,
  setCredentials,
  refreshAccessToken,
} = vi.hoisted(function createGoogleClientSpies() {
  return {
    createOAuth2Client: vi.fn(),
    getToken: vi.fn(),
    verifyIdToken: vi.fn(),
    setCredentials: vi.fn(),
    refreshAccessToken: vi.fn(),
  }
})

vi.mock("google-auth-library", async (importOriginal) => ({
  ...(await importOriginal()),
  OAuth2Client: function FakeOAuth2Client(options: unknown) {
    createOAuth2Client(options)

    return { getToken, verifyIdToken, setCredentials, refreshAccessToken }
  },
}))

const READER_ID = 1
const READER_SESSION = "reader-session"
const OTHER_READER_SESSION = "other-reader-session"

const toTokenPayload = (email: string, userId: number): TokenPayload => ({
  name: email,
  sub: email,
  userId,
  "couchdb.roles": [],
})

const SESSION_PAYLOADS = new Map([
  [READER_SESSION, toTokenPayload("reader@example.com", READER_ID)],
  [OTHER_READER_SESSION, toTokenPayload("other@example.com", 2)],
])

const CLIENT_ID = "123-oboku.apps.googleusercontent.com"
const CLIENT_SECRET = "client-secret"
const CODE = "4/authorization-code"
const REFRESH_TOKEN = "1//refresh-token"
const ID_TOKEN = "id-token"
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
const EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email"
const GRANTED_SCOPE = `openid ${DRIVE_FILE_SCOPE} ${EMAIL_SCOPE}`
const GOOGLE_ACCOUNT = { sub: "google-sub", email: "reader@gmail.com" }

const CONFIG: InstanceConfig = {
  version: 2,
  serverSync: { enabled: false, credentials: null, sources: [] },
  googleClientId: CLIENT_ID,
  googleApiKey: "api-key",
  googleClientSecret: CLIENT_SECRET,
  showDisabledPlugins: false,
  fileDownloadMaxSizeBytes: 1,
  allowPrivateNetworkRequests: false,
  privateNetworkAllowedHosts: [],
  opdsServersMaxPerUser: 10,
}

const CONNECTION_METHODS: Array<"get" | "put" | "delete"> = [
  "get",
  "put",
  "delete",
]

const grantTokens = (tokens: Record<string, unknown>) => {
  getToken.mockResolvedValue({ tokens, res: null })
}

const FRESH_ACCESS_TOKEN = "ya29.fresh-access-token"
const FRESH_TOKEN_LIFETIME_SECONDS = 3599

const createFreshTokenExpiry = () =>
  Date.now() + FRESH_TOKEN_LIFETIME_SECONDS * 1000

const CODE_EXCHANGE_FORM = { code: CODE, client_secret: CLIENT_SECRET }
const REFRESH_FORM = {
  refresh_token: REFRESH_TOKEN,
  client_secret: CLIENT_SECRET,
}

/** What gaxios rejects with when Google's token endpoint refuses the form it sent. */
const createGoogleRefusal = ({
  oauthError,
  status,
  form,
}: {
  oauthError: string
  status: number
  form: Record<string, string>
}) =>
  Object.assign(new Error(oauthError), {
    config: { data: new URLSearchParams(form) },
    response: { status, data: { error: oauthError } },
  })

describe("GoogleConnectionController", () => {
  let app: INestApplication<App>
  let rows: Map<string, ProviderConnectionPostgresEntity>
  let instanceConfig: BehaviorSubject<InstanceConfig>
  let providerConnectionsService: ProviderConnectionsService
  let googleConnectionService: GoogleConnectionService

  const getConnection = (session = READER_SESSION) =>
    request(app.getHttpServer())
      .get("/provider-connections/google")
      .set("Authorization", `Bearer ${session}`)

  const connect = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .put("/provider-connections/google")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const disconnect = (session = READER_SESSION) =>
    request(app.getHttpServer())
      .delete("/provider-connections/google")
      .set("Authorization", `Bearer ${session}`)

  const mintAccessToken = (session = READER_SESSION) =>
    request(app.getHttpServer())
      .post("/provider-connections/google/access-token")
      .set("Authorization", `Bearer ${session}`)

  beforeEach(async () => {
    createOAuth2Client.mockReset()
    getToken.mockReset()
    verifyIdToken.mockReset()
    setCredentials.mockReset()
    refreshAccessToken.mockReset()
    refreshAccessToken.mockResolvedValue({
      credentials: {
        access_token: FRESH_ACCESS_TOKEN,
        expiry_date: createFreshTokenExpiry(),
        scope: GRANTED_SCOPE,
        refresh_token: REFRESH_TOKEN,
      },
      res: null,
    })
    grantTokens({
      access_token: "access-token",
      refresh_token: REFRESH_TOKEN,
      id_token: ID_TOKEN,
      scope: GRANTED_SCOPE,
    })
    verifyIdToken.mockResolvedValue({ getPayload: () => GOOGLE_ACCOUNT })

    const connectionStore = createConnectionStore()
    rows = connectionStore.rows
    instanceConfig = new BehaviorSubject(CONFIG)

    const module = await Test.createTestingModule({
      controllers: [GoogleConnectionController],
      providers: [
        GoogleConnectionService,
        ProviderConnectionsService,
        AtRestCipher,
        {
          provide: ProviderConnectionPostgresService,
          useValue: connectionStore.store,
        },
        {
          provide: InstanceConfigService,
          useValue: { getConfig: () => instanceConfig },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: async (token: string) => {
              const payload = SESSION_PAYLOADS.get(token)

              if (!payload) throw new Error("no session")

              return payload
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

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    providerConnectionsService = module.get(ProviderConnectionsService)
    googleConnectionService = module.get(GoogleConnectionService)
  })

  afterEach(async () => {
    await app.close()
  })

  it("answers no connection before the user connects", async () => {
    const response = await getConnection()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ connection: null })
  })

  it("exchanges the code with the web app's client and keeps the refresh token, encrypted", async () => {
    const response = await connect({ code: CODE })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      connection: {
        accountName: GOOGLE_ACCOUNT.email,
        connectedAt: expect.any(String),
      },
    })
    expect(createOAuth2Client).toHaveBeenCalledWith({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: "postmessage",
    })
    expect(getToken).toHaveBeenCalledWith(CODE)
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: ID_TOKEN,
      audience: CLIENT_ID,
    })

    const stored = rows.get(`${READER_ID}:google`)

    expect(stored).toMatchObject({
      account_id: GOOGLE_ACCOUNT.sub,
      account_name: GOOGLE_ACCOUNT.email,
      scopes: GRANTED_SCOPE.split(" "),
    })
    expect(JSON.stringify(stored)).not.toContain(REFRESH_TOKEN)
    await expect(
      providerConnectionsService.getCredentials({
        userId: READER_ID,
        provider: "google",
      }),
    ).resolves.toEqual({ refreshToken: REFRESH_TOKEN })

    const connection = await getConnection()

    expect(connection.body).toEqual(response.body)
  })

  it.each([
    { missingSetting: "client id", config: { googleClientId: undefined } },
    {
      missingSetting: "client secret",
      config: { googleClientSecret: undefined },
    },
  ])("refuses to connect without the $missingSetting", async ({ config }) => {
    instanceConfig.next({ ...CONFIG, ...config })

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED },
    ])
    expect(getToken).not.toHaveBeenCalled()
  })

  it("refuses a code Google does not accept", async () => {
    getToken.mockRejectedValue(
      createGoogleRefusal({
        oauthError: "invalid_grant",
        status: 400,
        form: CODE_EXCHANGE_FORM,
      }),
    )

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CODE_REFUSED },
    ])
    expect(rows.size).toBe(0)
  })

  it("keeps the code and the client secret out of the error of a failed exchange", async () => {
    getToken.mockRejectedValue(
      createGoogleRefusal({
        oauthError: "invalid_client",
        status: 401,
        form: CODE_EXCHANGE_FORM,
      }),
    )

    const error = await googleConnectionService
      .connect({ userId: READER_ID, code: CODE })
      .catch(function captureFailure(failure: unknown) {
        return failure
      })
    const inspected = inspect(error, { depth: Number.POSITIVE_INFINITY })

    expect(error).toBeInstanceOf(Error)
    expect(inspected).toContain("invalid_client")
    expect(inspected).not.toContain(CODE)
    expect(inspected).not.toContain(CLIENT_SECRET)
    expect(rows.size).toBe(0)
  })

  it("keeps the ID token out of the error when it does not verify", async () => {
    verifyIdToken.mockRejectedValue(
      new Error(`Invalid token signature: ${ID_TOKEN}`),
    )

    const error = await googleConnectionService
      .connect({ userId: READER_ID, code: CODE })
      .catch(function captureFailure(failure: unknown) {
        return failure
      })

    expect(error).toBeInstanceOf(Error)
    expect(inspect(error, { depth: Number.POSITIVE_INFINITY })).not.toContain(
      ID_TOKEN,
    )
    expect(rows.size).toBe(0)
  })

  it.each([
    {
      missingScope: "drive.file",
      tokens: {
        refresh_token: REFRESH_TOKEN,
        id_token: ID_TOKEN,
        scope: `openid ${EMAIL_SCOPE}`,
      },
    },
    {
      missingScope: "openid",
      tokens: {
        refresh_token: REFRESH_TOKEN,
        scope: `${DRIVE_FILE_SCOPE} ${EMAIL_SCOPE}`,
      },
    },
  ])("refuses a grant without the $missingScope scope", async ({ tokens }) => {
    grantTokens(tokens)

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED },
    ])
    expect(rows.size).toBe(0)
  })

  it("refuses an account whose ID token has no email", async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: GOOGLE_ACCOUNT.sub }),
    })

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED },
    ])
    expect(rows.size).toBe(0)
  })

  it("refuses an exchange without a refresh token and keeps the current connection", async () => {
    await connect({ code: CODE })
    grantTokens({ id_token: ID_TOKEN, scope: GRANTED_SCOPE })

    const response = await connect({ code: "4/another-code" })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NO_REFRESH_TOKEN },
    ])
    await expect(
      providerConnectionsService.getCredentials({
        userId: READER_ID,
        provider: "google",
      }),
    ).resolves.toEqual({ refreshToken: REFRESH_TOKEN })
  })

  it("asks for a code", async () => {
    const response = await connect({})

    expect(response.status).toBe(400)
    expect(getToken).not.toHaveBeenCalled()
  })

  it("deletes the stored token without calling Google", async () => {
    await connect({ code: CODE })
    createOAuth2Client.mockReset()

    const response = await disconnect()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
    expect(rows.size).toBe(0)
    expect(createOAuth2Client).not.toHaveBeenCalled()
    expect((await getConnection()).body).toEqual({ connection: null })
  })

  it("keeps each user's connection to themselves", async () => {
    await connect({ code: CODE })

    expect((await getConnection(OTHER_READER_SESSION)).body).toEqual({
      connection: null,
    })

    await disconnect(OTHER_READER_SESSION)

    expect((await getConnection()).body.connection).toMatchObject({
      accountName: GOOGLE_ACCOUNT.email,
    })
  })

  it.each(CONNECTION_METHODS)(
    "answers %s only for a signed-in user",
    async (method) => {
      const response = await request(app.getHttpServer())
        [method]("/provider-connections/google")
        .send({ code: CODE })

      expect(response.status).toBe(401)
      expect(getToken).not.toHaveBeenCalled()
      expect(rows.size).toBe(0)
    },
  )

  describe("access token", () => {
    it("mints one from the stored refresh token, and keeps it out of caches", async () => {
      await connect({ code: CODE })
      createOAuth2Client.mockClear()

      const response = await mintAccessToken()

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        accessToken: FRESH_ACCESS_TOKEN,
        expiresIn: expect.any(Number),
        scopes: GRANTED_SCOPE.split(" "),
      })
      expect(response.body.expiresIn).toBeGreaterThan(
        FRESH_TOKEN_LIFETIME_SECONDS - 60,
      )
      expect(response.body.expiresIn).toBeLessThanOrEqual(
        FRESH_TOKEN_LIFETIME_SECONDS,
      )
      expect(response.headers["cache-control"]).toBe("no-store")
      expect(response.headers.pragma).toBe("no-cache")
      expect(createOAuth2Client).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      })
      expect(setCredentials).toHaveBeenCalledWith({
        refresh_token: REFRESH_TOKEN,
      })
    })

    it("answers that no account is connected without calling Google", async () => {
      const response = await mintAccessToken()

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND },
      ])
      expect(refreshAccessToken).not.toHaveBeenCalled()
    })

    it("refuses to mint until the admin sets the client secret", async () => {
      await connect({ code: CODE })
      instanceConfig.next({ ...CONFIG, googleClientSecret: undefined })

      const response = await mintAccessToken()

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED },
      ])
      expect(refreshAccessToken).not.toHaveBeenCalled()
      expect(rows.size).toBe(1)
    })

    it("answers the scopes Google gives the access token, else the granted ones", async () => {
      await connect({ code: CODE })
      refreshAccessToken.mockResolvedValueOnce({
        credentials: {
          access_token: FRESH_ACCESS_TOKEN,
          expiry_date: createFreshTokenExpiry(),
          scope: DRIVE_FILE_SCOPE,
        },
        res: null,
      })
      refreshAccessToken.mockResolvedValueOnce({
        credentials: {
          access_token: FRESH_ACCESS_TOKEN,
          expiry_date: createFreshTokenExpiry(),
        },
        res: null,
      })

      const narrowed = await mintAccessToken()
      const unstated = await mintAccessToken()

      expect(narrowed.body.scopes).toEqual([DRIVE_FILE_SCOPE])
      expect(unstated.body.scopes).toEqual(GRANTED_SCOPE.split(" "))
    })

    it("mints only from the signed-in user's own connection", async () => {
      await connect({ code: CODE })

      const response = await mintAccessToken(OTHER_READER_SESSION)

      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND },
      ])
      expect(refreshAccessToken).not.toHaveBeenCalled()
      expect(rows.size).toBe(1)
    })

    it("keeps the connection when Google cannot be reached", async () => {
      await connect({ code: CODE })
      refreshAccessToken.mockRejectedValue(new Error("socket hang up"))

      const response = await mintAccessToken()

      expect(response.status).toBe(500)
      expect(rows.size).toBe(1)
    })

    it("drops a connection whose refresh token Google refuses", async () => {
      await connect({ code: CODE })
      refreshAccessToken.mockRejectedValue(
        createGoogleRefusal({
          oauthError: "invalid_grant",
          status: 400,
          form: REFRESH_FORM,
        }),
      )

      const response = await mintAccessToken()

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST },
      ])
      expect(rows.size).toBe(0)
    })

    it("keeps the connection when Google refuses the client rather than the token", async () => {
      await connect({ code: CODE })
      refreshAccessToken.mockRejectedValue(
        createGoogleRefusal({
          oauthError: "unauthorized_client",
          status: 400,
          form: REFRESH_FORM,
        }),
      )

      const response = await mintAccessToken()

      expect(response.status).toBe(500)
      expect(rows.size).toBe(1)
    })

    it("drops a connection whose credentials no longer decrypt", async () => {
      await connect({ code: CODE })
      const readerRow = rows.get(`${READER_ID}:google`)

      if (!readerRow) throw new Error("The connection was not saved")

      readerRow.encrypted_credentials = "1.no-longer-decrypts"

      const response = await mintAccessToken()

      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST },
      ])
      expect(refreshAccessToken).not.toHaveBeenCalled()
      expect(rows.size).toBe(0)
    })

    it("keeps the connection, and the refresh token out of the error, when a refresh fails otherwise", async () => {
      await connect({ code: CODE })
      refreshAccessToken.mockRejectedValue(
        createGoogleRefusal({
          oauthError: "invalid_client",
          status: 401,
          form: REFRESH_FORM,
        }),
      )

      const error = await googleConnectionService
        .mintAccessToken(READER_ID)
        .catch(function captureFailure(failure: unknown) {
          return failure
        })
      const inspected = inspect(error, { depth: Number.POSITIVE_INFINITY })

      expect(error).toBeInstanceOf(Error)
      expect(inspected).toContain("invalid_client")
      expect(inspected).not.toContain(REFRESH_TOKEN)
      expect(inspected).not.toContain(CLIENT_SECRET)
      expect(rows.size).toBe(1)
    })

    it("answers only a signed-in user", async () => {
      const response = await request(app.getHttpServer()).post(
        "/provider-connections/google/access-token",
      )

      expect(response.status).toBe(401)
      expect(refreshAccessToken).not.toHaveBeenCalled()
    })
  })
})
