import { once } from "node:events"
import { createServer, type IncomingMessage } from "node:http"
import type { AddressInfo } from "node:net"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import {
  ObokuErrorCode,
  type SecretDocType,
  type SettingsConnectorDocType,
  type WebdavConnectorDocType,
} from "@oboku/shared"
import request from "supertest"
import type { App } from "supertest/types.js"
import { AuthGuard, type TokenPayload } from "../../auth/auth.guard.js"
import { SecretsService } from "../../config/SecretsService.js"
import { CouchService } from "../../couch/couch.service.js"
import { AtRestCipher } from "../../crypto/at-rest-cipher.js"
import type { SourceConnectionPostgresEntity } from "../../features/postgres/entities.js"
import { SourceConnectionPostgresService } from "../../features/postgres/source-connection-postgres.service.js"
import { setPrivateNetworkAllowedHosts } from "../../http/userAddressAgents.js"
import { buildMultiStatusXml } from "../../webdav/webdav.xml.js"
import {
  createConnectionStore,
  toConnectionRowKey,
} from "../source-connection-store.fixture.js"
import { SourceConnectionsService } from "../source-connections.service.js"
import { ConnectorConnectionController } from "./connector-connection.controller.js"
import { ConnectorConnectionService } from "./connector-connection.service.js"

const READER_ID = 1
const READER_EMAIL = "reader@example.com"
const READER_SESSION = "reader-session"
const OTHER_READER_SESSION = "other-reader-session"

const toTokenPayload = (email: string, userId: number): TokenPayload => ({
  name: email,
  sub: email,
  userId,
  "couchdb.roles": [],
})

const SESSION_PAYLOADS = new Map([
  [READER_SESSION, toTokenPayload(READER_EMAIL, READER_ID)],
  [OTHER_READER_SESSION, toTokenPayload("other@example.com", 2)],
])

const WEBDAV_USERNAME = "reader"
const WEBDAV_PASSWORD = "webdav-password-1234"

const ROOT_LISTING = buildMultiStatusXml([
  {
    href: "/",
    displayName: "",
    isDirectory: true,
    size: 0,
    lastModified: new Date("2026-01-01T00:00:00.000Z"),
    mimeType: "",
    etag: null,
  },
])

const isSignedIn = ({ headers }: IncomingMessage) =>
  headers.authorization ===
  `Basic ${Buffer.from(`${WEBDAV_USERNAME}:${WEBDAV_PASSWORD}`).toString("base64")}`

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

/** A WebDAV server that lists its root to the reader, or a server that answers 404 to everything. */
async function startServer({ isWebdav }: { isWebdav: boolean }) {
  const requests: IncomingMessage[] = []
  const server = createServer(function answerRequest(serverRequest, response) {
    requests.push(serverRequest)

    if (!isWebdav) {
      response.writeHead(404)
      response.end()

      return
    }

    if (!isSignedIn(serverRequest)) {
      response.writeHead(401, { "www-authenticate": 'Basic realm="nas"' })
      response.end()

      return
    }

    response.writeHead(207, {
      "content-type": "application/xml; charset=utf-8",
    })
    response.end(ROOT_LISTING)
  }).listen(0, "127.0.0.1")

  onTestFinished(async function closeServer() {
    server.close()
    await once(server, "close")
  })

  await once(server, "listening")

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  return { host: `127.0.0.1:${address.port}`, requests }
}

/** The password secret's value, as the app encrypts it with the master key. */
const ENCRYPTED_PASSWORD = { iv: "password-iv", data: "encrypted-password" }

const toPasswordSecret = (
  id: string,
  value: SecretDocType["value"] = ENCRYPTED_PASSWORD,
): SecretDocType => ({
  _id: id,
  _rev: "1-secret",
  rxdbMeta: { lwt: 0 },
  rx_model: "secret",
  name: "NAS password",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  value,
})

const toWebdavConnector = (
  host: string,
  id = "nas-connector",
): WebdavConnectorDocType => ({
  id,
  type: "webdav",
  url: `http://${host}/dav/`,
  username: WEBDAV_USERNAME,
  passwordAsSecretId: "nas-password-secret",
})

describe("ConnectorConnectionController", () => {
  let app: INestApplication<App>
  let rows: Map<string, SourceConnectionPostgresEntity>
  let connectorsByEmail: Map<string, SettingsConnectorDocType[]>
  let secretsById: Map<string, SecretDocType>
  let createNanoInstanceForUser: ReturnType<typeof vi.fn>
  let sourceConnectionsService: SourceConnectionsService

  const listConnections = (session = READER_SESSION) =>
    request(app.getHttpServer())
      .get("/provider-connections/connectors")
      .set("Authorization", `Bearer ${session}`)

  const connect = (connectorId: string, body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .put(`/provider-connections/connectors/${connectorId}`)
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const disconnect = (connectorId: string) =>
    request(app.getHttpServer())
      .delete(`/provider-connections/connectors/${connectorId}`)
      .set("Authorization", `Bearer ${READER_SESSION}`)

  /** Also gives each connector a password secret, unless it has one. */
  const setReaderConnectors = (connectors: SettingsConnectorDocType[]) => {
    connectorsByEmail.set(READER_EMAIL, connectors)

    for (const { passwordAsSecretId } of connectors) {
      if (!secretsById.has(passwordAsSecretId)) {
        secretsById.set(
          passwordAsSecretId,
          toPasswordSecret(passwordAsSecretId),
        )
      }
    }
  }

  const readerRowKey = (connectorId = "nas-connector") =>
    toConnectionRowKey({
      userId: READER_ID,
      provider: "webdav",
      accountId: connectorId,
    })

  beforeEach(async () => {
    const connectionStore = createConnectionStore()
    rows = connectionStore.rows
    connectorsByEmail = new Map()
    secretsById = new Map()
    createNanoInstanceForUser = vi.fn(async ({ email }: { email: string }) => ({
      get: async () => ({
        _id: "settings",
        connectors: connectorsByEmail.get(email) ?? [],
      }),
      fetch: async ({ keys }: { keys: string[] }) => ({
        rows: keys.map(function toAllDocsRow(key) {
          const doc = secretsById.get(key)

          return doc
            ? { id: key, key, value: { rev: doc._rev }, doc }
            : { key, error: "not_found" }
        }),
      }),
    }))

    const module = await Test.createTestingModule({
      controllers: [ConnectorConnectionController],
      providers: [
        ConnectorConnectionService,
        SourceConnectionsService,
        AtRestCipher,
        {
          provide: SourceConnectionPostgresService,
          useValue: connectionStore.store,
        },
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
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

    sourceConnectionsService = module.get(SourceConnectionsService)
  })

  afterEach(async () => {
    setPrivateNetworkAllowedHosts([])
    await app.close()
  })

  it("answers no connection before the user connects, without reading their settings", async () => {
    const response = await listConnections()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ connections: [] })
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
  })

  it("signs in to the WebDAV server, then keeps the connector with its password, encrypted", async () => {
    const { host, requests } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])

    const response = await connect(connector.id, { password: WEBDAV_PASSWORD })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      connection: {
        connectorId: connector.id,
        status: "connected",
        connectedAt: expect.any(String),
      },
    })
    expect(createNanoInstanceForUser).toHaveBeenCalledWith({
      email: READER_EMAIL,
    })
    expect(requests.some(isSignedIn)).toBe(true)
    expect(JSON.stringify(rows.get(readerRowKey()))).not.toContain(
      WEBDAV_PASSWORD,
    )
    await expect(
      sourceConnectionsService.getCredentials({
        userId: READER_ID,
        provider: "webdav",
        accountId: connector.id,
      }),
    ).resolves.toEqual({
      connector,
      passwordSecretValue: ENCRYPTED_PASSWORD,
      password: WEBDAV_PASSWORD,
    })
    expect((await listConnections()).body).toEqual({
      connections: [response.body.connection],
    })
  })

  it("keeps a connection per connector", async () => {
    const { host } = await startServer({ isWebdav: true })
    const nas = toWebdavConnector(host)
    const backupNas = toWebdavConnector(host, "backup-nas-connector")
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([nas, backupNas])

    await connect(nas.id, { password: WEBDAV_PASSWORD })
    await connect(backupNas.id, { password: WEBDAV_PASSWORD })

    const { body } = await listConnections()

    expect(
      body.connections.map(
        ({ connectorId }: { connectorId: string }) => connectorId,
      ),
    ).toEqual(expect.arrayContaining([nas.id, backupNas.id]))
    expect(rows.size).toBe(2)
  })

  it.each([
    {
      refusal: "a password the server refuses",
      isWebdav: true,
      password: "wrong-password",
      code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
    },
    {
      refusal: "a server that does not answer like a WebDAV server",
      isWebdav: false,
      password: WEBDAV_PASSWORD,
      code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
    },
  ])(
    "refuses $refusal and keeps nothing",
    async ({ isWebdav, password, code }) => {
      const { host } = await startServer({ isWebdav })
      const connector = toWebdavConnector(host)
      setPrivateNetworkAllowedHosts([host])
      setReaderConnectors([connector])

      const response = await connect(connector.id, { password })

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([{ code }])
      expect(rows.size).toBe(0)
    },
  )

  it("refuses a server that cannot be reached", async () => {
    const { host } = await startServer({ isWebdav: true })
    const closedHost = "127.0.0.1:9"
    setPrivateNetworkAllowedHosts([host, closedHost])
    setReaderConnectors([toWebdavConnector(closedHost)])

    const response = await connect("nas-connector", {
      password: WEBDAV_PASSWORD,
    })

    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE },
    ])
    expect(rows.size).toBe(0)
  })

  it("refuses a server on a private network the instance does not allow", async () => {
    const { host, requests } = await startServer({ isWebdav: true })
    setReaderConnectors([toWebdavConnector(host)])

    const response = await connect("nas-connector", {
      password: WEBDAV_PASSWORD,
    })

    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED },
    ])
    expect(requests).toEqual([])
    expect(rows.size).toBe(0)
  })

  it("refuses a connector the user's settings do not hold", async () => {
    const response = await connect("missing-connector", {
      password: WEBDAV_PASSWORD,
    })

    expect(response.status).toBe(400)
    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND },
    ])
  })

  it("refuses a connector whose password secret the settings do not hold, without contacting its server", async () => {
    const { host, requests } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    secretsById.delete(connector.passwordAsSecretId)

    const response = await connect(connector.id, { password: WEBDAV_PASSWORD })

    expect(response.body.errors).toEqual([
      { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND },
    ])
    expect(requests).toEqual([])
    expect(rows.size).toBe(0)
  })

  it("refuses a connector type it cannot sign in to", async () => {
    setReaderConnectors([
      {
        id: "synology-connector",
        type: "synology-drive",
        url: "https://nas.example.com",
        username: WEBDAV_USERNAME,
        passwordAsSecretId: "synology-password-secret",
      },
    ])

    const response = await connect("synology-connector", {
      password: WEBDAV_PASSWORD,
    })

    expect(response.status).toBe(400)
    expect(rows.size).toBe(0)
  })

  it("asks for a password", async () => {
    const response = await connect("nas-connector", {})

    expect(response.status).toBe(400)
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
  })

  it("lists a connection whose connector changed as such, until the user connects it again", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    const editedConnector = { ...connector, url: `http://${host}/other-dav/` }
    setReaderConnectors([editedConnector])

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connector-changed" }),
    ])
    expect(rows.size).toBe(1)

    await connect(connector.id, { password: WEBDAV_PASSWORD })

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connected" }),
    ])
    await expect(
      sourceConnectionsService.getCredentials({
        userId: READER_ID,
        provider: "webdav",
        accountId: connector.id,
      }),
    ).resolves.toEqual({
      connector: editedConnector,
      passwordSecretValue: ENCRYPTED_PASSWORD,
      password: WEBDAV_PASSWORD,
    })
  })

  it("keeps a connection connected when the user only turns the proxy on or off", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    setReaderConnectors([{ ...connector, proxyThroughServer: true }])

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connected" }),
    ])

    setReaderConnectors([
      {
        ...connector,
        proxyThroughServer: true,
        url: `http://${host}/other-dav/`,
      },
    ])

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connector-changed" }),
    ])
  })

  it("lists a connection whose password changed as such, and one whose secret was only renamed as connected", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    secretsById.set(connector.passwordAsSecretId, {
      ...toPasswordSecret(connector.passwordAsSecretId),
      name: "Renamed NAS password",
    })

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connected" }),
    ])

    secretsById.set(
      connector.passwordAsSecretId,
      toPasswordSecret(connector.passwordAsSecretId, {
        iv: "new-password-iv",
        data: "encrypted-new-password",
      }),
    )

    expect((await listConnections()).body.connections).toEqual([
      expect.objectContaining({ status: "connector-changed" }),
    ])
    expect(rows.size).toBe(1)
  })

  it("deletes a connection whose password secret is gone", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    secretsById.delete(connector.passwordAsSecretId)

    expect((await listConnections()).body).toEqual({ connections: [] })
    expect(rows.size).toBe(0)
  })

  it("deletes a connection whose connector is gone", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    setReaderConnectors([])

    expect((await listConnections()).body).toEqual({ connections: [] })
    expect(rows.size).toBe(0)
  })

  it("deletes a connection whose credentials no longer decrypt", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    const readerRow = rows.get(readerRowKey())

    if (!readerRow) throw new Error("The connection was not saved")

    readerRow.encrypted_credentials = "1.no-longer-decrypts"

    expect((await listConnections()).body).toEqual({ connections: [] })
    expect(rows.size).toBe(0)
  })

  it("deletes the stored password when the user disconnects", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    const response = await disconnect(connector.id)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
    expect(rows.size).toBe(0)
  })

  it("keeps each user's connections to themselves", async () => {
    const { host } = await startServer({ isWebdav: true })
    const connector = toWebdavConnector(host)
    setPrivateNetworkAllowedHosts([host])
    setReaderConnectors([connector])
    await connect(connector.id, { password: WEBDAV_PASSWORD })

    expect((await listConnections(OTHER_READER_SESSION)).body).toEqual({
      connections: [],
    })
  })

  it("answers only a signed-in user", async () => {
    const response = await request(app.getHttpServer()).get(
      "/provider-connections/connectors",
    )

    expect(response.status).toBe(401)
  })
})
