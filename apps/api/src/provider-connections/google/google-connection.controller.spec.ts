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

const { createOAuth2Client, getToken, verifyIdToken } = vi.hoisted(
  function createGoogleClientSpies() {
    return {
      createOAuth2Client: vi.fn(),
      getToken: vi.fn(),
      verifyIdToken: vi.fn(),
    }
  },
)

vi.mock("google-auth-library", async (importOriginal) => ({
  ...(await importOriginal()),
  OAuth2Client: function FakeOAuth2Client(options: unknown) {
    createOAuth2Client(options)

    return { getToken, verifyIdToken }
  },
}))

const READER_ID = 1
const READER_SESSION = "reader-session"

const readerTokenPayload: TokenPayload = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: READER_ID,
  "couchdb.roles": [],
}

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

const grantTokens = (tokens: Record<string, unknown>) => {
  getToken.mockResolvedValue({ tokens, res: null })
}

/** What gaxios rejects with when Google's token endpoint refuses a request. */
const createGoogleRefusal = (oauthError: string, status: number) =>
  Object.assign(new Error(oauthError), {
    config: {
      data: new URLSearchParams({ code: CODE, client_secret: CLIENT_SECRET }),
    },
    response: { status, data: { error: oauthError } },
  })

describe("GoogleConnectionController", () => {
  let app: INestApplication<App>
  let rows: Map<string, ProviderConnectionPostgresEntity>
  let instanceConfig: BehaviorSubject<InstanceConfig>
  let providerConnectionsService: ProviderConnectionsService
  let googleConnectionService: GoogleConnectionService

  const getConnection = () =>
    request(app.getHttpServer())
      .get("/provider-connections/google")
      .set("Authorization", `Bearer ${READER_SESSION}`)

  const connect = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .put("/provider-connections/google")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const disconnect = () =>
    request(app.getHttpServer())
      .delete("/provider-connections/google")
      .set("Authorization", `Bearer ${READER_SESSION}`)

  beforeEach(async () => {
    createOAuth2Client.mockReset()
    getToken.mockReset()
    verifyIdToken.mockReset()
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
              if (token !== READER_SESSION) throw new Error("no session")

              return readerTokenPayload
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

  it("refuses to connect until the admin sets the client secret", async () => {
    instanceConfig.next({ ...CONFIG, googleClientSecret: undefined })

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED },
    ])
    expect(getToken).not.toHaveBeenCalled()
  })

  it("refuses a code Google does not accept", async () => {
    getToken.mockRejectedValue(createGoogleRefusal("invalid_grant", 400))

    const response = await connect({ code: CODE })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CODE_REFUSED },
    ])
    expect(rows.size).toBe(0)
  })

  it("keeps the code and the client secret out of the error of a failed exchange", async () => {
    getToken.mockRejectedValue(createGoogleRefusal("invalid_client", 401))

    const error = await googleConnectionService
      .connect({ userId: READER_ID, code: CODE })
      .then(
        () => undefined,
        (failure: unknown) => failure,
      )
    const inspected = inspect(error, { depth: Number.POSITIVE_INFINITY })

    expect(inspected).toContain("invalid_client")
    expect(inspected).not.toContain(CODE)
    expect(inspected).not.toContain(CLIENT_SECRET)
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

  it("answers only a signed-in user", async () => {
    const response = await request(app.getHttpServer()).get(
      "/provider-connections/google",
    )

    expect(response.status).toBe(401)
  })
})
