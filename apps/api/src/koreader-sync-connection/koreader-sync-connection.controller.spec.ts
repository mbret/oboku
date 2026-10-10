import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import { createServer, type RequestListener, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import request from "supertest"
import type { App } from "supertest/types.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { SecretsService } from "../config/SecretsService.js"
import type {
  KoreaderSyncConnectionPostgresEntity,
  KoreaderSyncCredentialPostgresEntity,
  UserPostgresEntity,
} from "../features/postgres/entities.js"
import { KoreaderSyncConnectionPostgresService } from "../features/postgres/koreader-sync-connection-postgres.service.js"
import { KoreaderSyncPostgresService } from "../features/postgres/koreader-sync-postgres.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { toSyncKey } from "../koreader-sync-server/credentials.js"
import { KoreaderSyncAuthGuard } from "../koreader-sync-server/koreader-sync-auth.guard.js"
import { KoreaderSyncProtocolController } from "../koreader-sync-server/koreader-sync-protocol.controller.js"
import { KoreaderSyncServerService } from "../koreader-sync-server/koreader-sync-server.service.js"
import { KoreaderSyncConnectionKeyCipher } from "./connection-key-cipher.js"
import { KoreaderSyncConnectionController } from "./koreader-sync-connection.controller.js"
import { KoreaderSyncConnectionService } from "./koreader-sync-connection.service.js"

const READER: UserPostgresEntity = {
  id: 1,
  email: "reader@example.com",
  username: "reader@example.com",
  createdAt: new Date(),
}
const READER_SESSION = "reader-session"

const readerTokenPayload: TokenPayload = {
  name: READER.email,
  sub: READER.email,
  userId: READER.id,
  "couchdb.roles": [],
}

const createUserStore = (): Pick<UserPostgresService, "findByEmail"> => ({
  findByEmail: async (email) => (email === READER.email ? READER : null),
})

const createCredentialStore = (): Pick<
  KoreaderSyncPostgresService,
  "findCredentialByUserId" | "saveCredential"
> => {
  const credentials = new Map<number, KoreaderSyncCredentialPostgresEntity>()

  return {
    findCredentialByUserId: async (userId) => credentials.get(userId) ?? null,
    saveCredential: async ({ userId, keyHash }) => {
      credentials.set(userId, {
        id: userId,
        user_id: userId,
        key_hash: keyHash,
        created_at: new Date(),
      })
    },
  }
}

const createConnectionStore = () => {
  const connections = new Map<number, KoreaderSyncConnectionPostgresEntity>()

  const store: Pick<
    KoreaderSyncConnectionPostgresService,
    "findByUserId" | "save" | "deleteByUserId"
  > = {
    findByUserId: async (userId) => connections.get(userId) ?? null,
    save: async ({ userId, serverUrl, username, encryptedKey }) => {
      connections.set(userId, {
        id: userId,
        user_id: userId,
        server_url: serverUrl,
        username,
        encrypted_key: encryptedKey,
        connected_at: new Date(),
      })
    },
    deleteByUserId: async (userId) => {
      connections.delete(userId)
    },
  }

  return { store, connections }
}

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

const toBaseUrl = (server: Pick<Server, "address">) => {
  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  return `http://127.0.0.1:${address.port}`
}

const startUpstreamServer = async (listener: RequestListener) => {
  const server = createServer(listener)

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))

  return server
}

describe("KoreaderSyncConnectionController", () => {
  let app: INestApplication<App>
  let obokuServerUrl: string
  let readerPassword: string
  let connections: Map<number, KoreaderSyncConnectionPostgresEntity>
  let keyCipher: KoreaderSyncConnectionKeyCipher
  const appConfig = { KOREADER_SYNC_ALLOW_PRIVATE_NETWORK: true }
  const upstreamServers: Server[] = []

  const connect = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .put("/koreader-sync-connection")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const getConnection = () =>
    request(app.getHttpServer())
      .get("/koreader-sync-connection")
      .set("Authorization", `Bearer ${READER_SESSION}`)

  const startUpstream = async (listener: RequestListener) => {
    const server = await startUpstreamServer(listener)

    upstreamServers.push(server)

    return toBaseUrl(server)
  }

  beforeEach(async () => {
    appConfig.KOREADER_SYNC_ALLOW_PRIVATE_NETWORK = true
    const connectionStore = createConnectionStore()
    connections = connectionStore.connections

    const module = await Test.createTestingModule({
      controllers: [
        KoreaderSyncConnectionController,
        KoreaderSyncProtocolController,
      ],
      providers: [
        KoreaderSyncConnectionService,
        KoreaderSyncConnectionKeyCipher,
        KoreaderSyncServerService,
        KoreaderSyncAuthGuard,
        { provide: AppConfigService, useValue: appConfig },
        { provide: UserPostgresService, useValue: createUserStore() },
        {
          provide: KoreaderSyncPostgresService,
          useValue: createCredentialStore(),
        },
        {
          provide: KoreaderSyncConnectionPostgresService,
          useValue: connectionStore.store,
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
    await app.listen(0, "127.0.0.1")

    obokuServerUrl = `${await app.getUrl()}/kosync`
    keyCipher = module.get(KoreaderSyncConnectionKeyCipher)
    readerPassword = await module
      .get(KoreaderSyncServerService)
      .createPassword(READER.id)
  })

  afterEach(async () => {
    await app.close()
    await Promise.all(
      upstreamServers
        .splice(0)
        .map(
          (server) =>
            new Promise((resolve) => server.close(() => resolve(undefined))),
        ),
    )
  })

  it("connects to oboku's own sync server and keeps only the encrypted key", async () => {
    const response = await connect({
      serverUrl: `${obokuServerUrl}/`,
      username: READER.email,
      password: readerPassword,
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      connection: {
        serverUrl: obokuServerUrl,
        username: READER.email,
        connectedAt: expect.any(String),
      },
    })

    const stored = connections.get(READER.id)

    expect(stored?.encrypted_key).not.toContain(toSyncKey(readerPassword))
    expect(stored?.encrypted_key).not.toContain(readerPassword)
    expect(await keyCipher.decrypt(stored?.encrypted_key ?? "")).toBe(
      toSyncKey(readerPassword),
    )
  })

  it("signs in the way KOReader does", async () => {
    let received: Record<string, string | string[] | undefined> = {}
    const serverUrl = await startUpstream(function answerAuth(req, res) {
      received = { url: req.url, method: req.method, ...req.headers }
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ authorized: "OK" }))
    })

    await connect({ serverUrl, username: "kobo", password: "secret" })

    expect(received).toMatchObject({
      url: "/users/auth",
      method: "GET",
      accept: "application/vnd.koreader.v1+json",
      "x-auth-user": "kobo",
      "x-auth-key": toSyncKey("secret"),
    })
  })

  it("reports the connection without its key", async () => {
    await connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: readerPassword,
    })

    const response = await getConnection()

    expect(response.status).toBe(200)
    expect(Object.keys(response.body.connection).sort()).toEqual([
      "connectedAt",
      "serverUrl",
      "username",
    ])
  })

  it("refuses a wrong password and keeps nothing", async () => {
    const response = await connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: "not-the-password",
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED },
    ])
    expect(connections.size).toBe(0)
  })

  it("refuses a server on a private network unless the instance allows it", async () => {
    appConfig.KOREADER_SYNC_ALLOW_PRIVATE_NETWORK = false

    const response = await connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: readerPassword,
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_ADDRESS_NOT_ALLOWED },
    ])
  })

  it.each([
    {
      server: "answers with an error",
      listener: function answerError(_req, res) {
        res.writeHead(500, { "content-type": "application/json" })
        res.end(JSON.stringify({ message: "boom" }))
      } satisfies RequestListener,
    },
    {
      server: "answers with a web page",
      listener: function answerHtml(_req, res) {
        res.writeHead(200, { "content-type": "text/html" })
        res.end("<html>Not a sync server</html>")
      } satisfies RequestListener,
    },
  ])("reports a server that $server as unreachable", async ({ listener }) => {
    const serverUrl = await startUpstream(listener)

    const response = await connect({
      serverUrl,
      username: "kobo",
      password: "secret",
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE },
    ])
  })

  it("reports an address nothing listens on as unreachable", async () => {
    const closedServer = await startUpstreamServer(function unused() {})
    const serverUrl = toBaseUrl(closedServer)
    await new Promise((resolve) => closedServer.close(resolve))

    const response = await connect({
      serverUrl,
      username: "kobo",
      password: "secret",
    })

    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE },
    ])
  })

  it.each(["not a url", "ftp://sync.example.com", "sync.example.com"])(
    "refuses %s as a server address",
    async (serverUrl) => {
      const response = await connect({
        serverUrl,
        username: "kobo",
        password: "secret",
      })

      expect(response.status).toBe(400)
      expect(connections.size).toBe(0)
    },
  )

  it("disconnects", async () => {
    await connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: readerPassword,
    })

    const response = await request(app.getHttpServer())
      .delete("/koreader-sync-connection")
      .set("Authorization", `Bearer ${READER_SESSION}`)

    expect(response.status).toBe(200)
    expect((await getConnection()).body).toEqual({ connection: null })
  })

  it("requires a signed-in user", async () => {
    const response = await request(app.getHttpServer()).get(
      "/koreader-sync-connection",
    )

    expect(response.status).toBe(401)
  })
})
