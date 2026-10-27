import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import { randomBytes } from "node:crypto"
import {
  createServer,
  type IncomingMessage,
  type RequestListener,
  type Server,
} from "node:http"
import type { AddressInfo } from "node:net"
import request from "supertest"
import type { App } from "supertest/types.js"
import { AuthGuard, type TokenPayload } from "../../auth/auth.guard.js"
import { SecretsService } from "../../config/SecretsService.js"
import type {
  KoreaderSyncConnectionPostgresEntity,
  KoreaderSyncCredentialPostgresEntity,
  KoreaderSyncProgressPostgresEntity,
  UserPostgresEntity,
} from "../../features/postgres/entities.js"
import { KoreaderSyncConnectionPostgresService } from "../../features/postgres/koreader-sync-connection-postgres.service.js"
import { KoreaderSyncPostgresService } from "../../features/postgres/koreader-sync-postgres.service.js"
import { UserPostgresService } from "../../features/postgres/user-postgres.service.js"
import { encryptAes256Gcm } from "../../lib/crypto/aes256Gcm.js"
import { toSyncKey } from "../protocol.js"
import { KoreaderSyncAuthGuard } from "../sync-server/koreader-sync-auth.guard.js"
import { KoreaderSyncProtocolController } from "../sync-server/koreader-sync-protocol.controller.js"
import { KoreaderSyncServerService } from "../sync-server/koreader-sync-server.service.js"
import { setPrivateNetworkRequestsAllowed } from "../../lib/http/userAddressAgents.js"
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

const DOCUMENT = "5d41402abc4b2a76b9719d911017c592"
const INSTALLATION_ID = "0b5c6f9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f"
const POSITION = {
  document: DOCUMENT,
  progress: "/body/DocFragment[3]/body/p[12]/text().0",
  percentage: 0.42,
  deviceId: INSTALLATION_ID,
}

const createCredentialStore = (): Pick<
  KoreaderSyncPostgresService,
  "findCredentialByUserId" | "saveCredential" | "findProgress" | "saveProgress"
> => {
  const credentials = new Map<number, KoreaderSyncCredentialPostgresEntity>()
  const positions = new Map<string, KoreaderSyncProgressPostgresEntity>()
  const toPositionKey = (userId: number, document: string) =>
    `${userId}/${document}`

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
    findProgress: async ({ userId, document }) =>
      positions.get(toPositionKey(userId, document)) ?? null,
    saveProgress: async ({ progress, keyHash }) => {
      const isCredentialCurrent =
        credentials.get(progress.user_id)?.key_hash === keyHash

      if (!isCredentialCurrent) return false

      positions.set(toPositionKey(progress.user_id, progress.document), {
        id: positions.size + 1,
        ...progress,
      })

      return true
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

const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = []

  for await (const chunk of req) chunks.push(chunk)

  return JSON.parse(Buffer.concat(chunks).toString())
}

const answerAuthorized: RequestListener = function answerAuthorized(_req, res) {
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ authorized: "OK" }))
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
  let koreaderSyncServerService: KoreaderSyncServerService
  let connections: Map<number, KoreaderSyncConnectionPostgresEntity>
  let keyCipher: KoreaderSyncConnectionKeyCipher
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

  const connectToObokuServer = () =>
    connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: readerPassword,
    })

  const pushPosition = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .put("/koreader-sync-connection/progress")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const pullPosition = (document: string) =>
    request(app.getHttpServer())
      .get(`/koreader-sync-connection/progress/${document}`)
      .set("Authorization", `Bearer ${READER_SESSION}`)

  const startUpstream = async (listener: RequestListener) => {
    const server = await startUpstreamServer(listener)

    upstreamServers.push(server)

    return toBaseUrl(server)
  }

  beforeEach(async () => {
    setPrivateNetworkRequestsAllowed(true)
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
    koreaderSyncServerService = module.get(KoreaderSyncServerService)
    readerPassword = await koreaderSyncServerService.createPassword(READER.id)
  })

  afterEach(async () => {
    setPrivateNetworkRequestsAllowed(false)
    vi.restoreAllMocks()
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
    setPrivateNetworkRequestsAllowed(false)

    const response = await connect({
      serverUrl: obokuServerUrl,
      username: READER.email,
      password: readerPassword,
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED },
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
    {
      server: "answers too much",
      listener: function answerTooMuch(_req, res) {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(
          JSON.stringify({ authorized: "OK", padding: "x".repeat(65_536) }),
        )
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

  it("reports a server still answering at the deadline as unreachable", async () => {
    const shortenedDeadlineMs = 100
    const createDeadline = AbortSignal.timeout.bind(AbortSignal)
    vi.spyOn(AbortSignal, "timeout").mockImplementation(
      function shortenDeadline() {
        return createDeadline(shortenedDeadlineMs)
      },
    )
    const serverUrl = await startUpstream(function dripAnswer(_req, res) {
      res.writeHead(200, { "content-type": "application/json" })
      res.write("{")
      const drip = setInterval(function writeOneMoreByte() {
        res.write(" ")
      }, 10)
      res.on("close", function stopDripping() {
        clearInterval(drip)
      })
    })

    const response = await connect({
      serverUrl,
      username: "kobo",
      password: "secret",
    })

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

  it("pushes a position the way KOReader does, as the device oboku", async () => {
    let push: Record<string, unknown> = {}
    const serverUrl = await startUpstream(async function recordPush(req, res) {
      if (req.method === "PUT") {
        push = { url: req.url, ...req.headers, body: await readJsonBody(req) }
      }

      answerAuthorized(req, res)
    })
    await connect({ serverUrl, username: "kobo", password: "secret" })

    const response = await pushPosition(POSITION)

    expect(response.status).toBe(200)
    expect(push).toMatchObject({
      url: "/syncs/progress",
      accept: "application/vnd.koreader.v1+json",
      "x-auth-user": "kobo",
      "x-auth-key": toSyncKey("secret"),
    })
    expect(push.body).toEqual({
      document: POSITION.document,
      progress: POSITION.progress,
      percentage: POSITION.percentage,
      device: "oboku",
      device_id: INSTALLATION_ID,
    })
  })

  it("pulls back the position it pushed, through oboku's own sync server", async () => {
    await connectToObokuServer()
    await pushPosition(POSITION)

    const response = await pullPosition(DOCUMENT)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      position: {
        progress: POSITION.progress,
        percentage: POSITION.percentage,
        device: "oboku",
        deviceId: INSTALLATION_ID,
        updatedAt: expect.any(String),
      },
    })
    const pushedMsAgo =
      Date.now() - Date.parse(response.body.position.updatedAt)
    expect(pushedMsAgo).toBeGreaterThanOrEqual(0)
    expect(pushedMsAgo).toBeLessThan(5_000)
  })

  it("pulls the position a device pushed without a device id", async () => {
    await connectToObokuServer()
    await request(app.getHttpServer())
      .put("/kosync/syncs/progress")
      .set("x-auth-user", READER.email)
      .set("x-auth-key", toSyncKey(readerPassword))
      .send({
        document: DOCUMENT,
        progress: "12",
        percentage: 0.5,
        device: "Kobo",
      })

    const response = await pullPosition(DOCUMENT)

    expect(response.body.position).toMatchObject({
      progress: "12",
      percentage: 0.5,
      device: "Kobo",
      deviceId: null,
    })
  })

  it("pulls a position from a server that says neither who pushed it nor when", async () => {
    const serverUrl = await startUpstream(
      function answerBarePosition(req, res) {
        if (req.method !== "GET" || req.url === "/users/auth") {
          answerAuthorized(req, res)

          return
        }

        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ progress: 12, percentage: "0.5" }))
      },
    )
    await connect({ serverUrl, username: "kobo", password: "secret" })

    const response = await pullPosition(DOCUMENT)

    expect(response.body).toEqual({
      position: {
        progress: "12",
        percentage: 0.5,
        device: null,
        deviceId: null,
        updatedAt: null,
      },
    })
  })

  it("pulls no position for a book the server keeps none for", async () => {
    await connectToObokuServer()

    const response = await pullPosition(DOCUMENT)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ position: null })
  })

  it("keeps the document within the progress route when pulling", async () => {
    let pulledUrl: string | undefined
    const serverUrl = await startUpstream(function recordPull(req, res) {
      pulledUrl = req.url
      answerAuthorized(req, res)
    })
    await connect({ serverUrl, username: "kobo", password: "secret" })

    await pullPosition(encodeURIComponent("../../users/auth"))

    expect(pulledUrl).toBe("/syncs/progress/..%2F..%2Fusers%2Fauth")
  })

  it.each([
    {
      refused: "a document the server could not read back",
      body: { ...POSITION, document: "../users" },
    },
    { refused: "an empty progress", body: { ...POSITION, progress: "" } },
    {
      refused: "a percentage past the end of the book",
      body: { ...POSITION, percentage: 1.5 },
    },
    { refused: "no device id", body: { ...POSITION, deviceId: undefined } },
  ])("refuses to push $refused", async ({ body }) => {
    let receivedPushes = 0
    const serverUrl = await startUpstream(function countPushes(req, res) {
      if (req.method === "PUT") receivedPushes += 1

      answerAuthorized(req, res)
    })
    await connect({ serverUrl, username: "kobo", password: "secret" })

    const response = await pushPosition(body)

    expect(response.status).toBe(400)
    expect(receivedPushes).toBe(0)
  })

  it("answers that no server is connected when pushing or pulling without one", async () => {
    expect((await pushPosition(POSITION)).status).toBe(404)
    expect((await pullPosition(DOCUMENT)).status).toBe(404)
  })

  it("reports the server refusing the key it was connected with", async () => {
    await connectToObokuServer()
    await koreaderSyncServerService.createPassword(READER.id)

    for (const response of [
      await pushPosition(POSITION),
      await pullPosition(DOCUMENT),
    ]) {
      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED },
      ])
    }
  })

  it("asks to sign in again once the stored key can no longer be read", async () => {
    let receivedRequests = 0
    const serverUrl = await startUpstream(function countRequests(req, res) {
      receivedRequests += 1
      answerAuthorized(req, res)
    })
    await connect({ serverUrl, username: "kobo", password: "secret" })
    const requestsToConnect = receivedRequests
    const connection = connections.get(READER.id)
    if (!connection) throw new Error("Not connected")
    connections.set(READER.id, {
      ...connection,
      encrypted_key: encryptAes256Gcm(toSyncKey("secret"), randomBytes(32)),
    })

    const response = await pullPosition(DOCUMENT)

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED },
    ])
    expect(receivedRequests).toBe(requestsToConnect)
  })

  it("reports a server failing a push as unreachable", async () => {
    const serverUrl = await startUpstream(function failPushes(req, res) {
      if (req.method !== "PUT") {
        answerAuthorized(req, res)

        return
      }

      res.writeHead(500, { "content-type": "application/json" })
      res.end(JSON.stringify({ message: "boom" }))
    })
    await connect({ serverUrl, username: "kobo", password: "secret" })

    const response = await pushPosition(POSITION)

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNREACHABLE },
    ])
  })

  it("requires a signed-in user", async () => {
    const response = await request(app.getHttpServer()).get(
      "/koreader-sync-connection",
    )

    expect(response.status).toBe(401)
  })
})
