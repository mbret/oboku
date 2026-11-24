import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import request from "supertest"
import type { App } from "supertest/types.js"
import type { FileStat } from "webdav"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService } from "../couch/couch.service.js"
import { NonPublicAddressError } from "../http/publicAddress.js"
import { ConnectorsController } from "./connectors.controller.js"
import { ConnectorsService } from "./connectors.service.js"

const { listWebdavDirectory } = vi.hoisted(function createWebdavSpies() {
  return { listWebdavDirectory: vi.fn() }
})

vi.mock(
  "../plugins/webdav/index.js",
  async function mockWebdavListing(importOriginal) {
    return {
      ...(await importOriginal<typeof import("../plugins/webdav/index.js")>()),
      listWebdavDirectory,
    }
  },
)

const READER_SESSION = "reader-session"

const readerTokenPayload: TokenPayload = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  "couchdb.roles": [],
}

const PASSWORD = "koofr-app-password"

const KOOFR_CONNECTOR = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "secret-koofr",
  proxyThroughServer: true,
}

const BOOKS_DIRECTORY: FileStat = {
  filename: "/Books/Comics",
  basename: "Comics",
  lastmod: "Mon, 16 Nov 2026 08:00:00 GMT",
  size: 0,
  type: "directory",
  etag: null,
}

const DUNE_FILE: FileStat = {
  filename: "/Books/Dune.epub",
  basename: "Dune.epub",
  lastmod: "Mon, 16 Nov 2026 08:00:00 GMT",
  size: 1024,
  type: "file",
  etag: "dune-etag",
  mime: "application/epub+zip",
}

const SERVER_FAILURES: ReadonlyArray<[string, Error, number, ObokuErrorCode]> =
  [
    [
      "a missing directory with 404",
      Object.assign(new Error("Invalid response: 404"), { status: 404 }),
      404,
      ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
    ],
    [
      "a refused password with 502",
      Object.assign(new Error("Invalid response: 401"), { status: 401 }),
      502,
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
    ],
    [
      "an address the instance does not reach with 400",
      new NonPublicAddressError("nas.local"),
      400,
      ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED,
    ],
  ]

const createSettingsDb = (
  connectors: ReadonlyArray<Record<string, unknown>> = [KOOFR_CONNECTOR],
) => ({
  get: async () => ({ _id: "settings", connectors }),
})

describe("ConnectorsController", () => {
  let app: INestApplication<App>

  const createNanoInstanceForUser = vi.fn()

  const listDirectory = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post("/connectors/webdav/directory")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send(body)

  const listBooksDirectory = () =>
    listDirectory({
      connectorId: KOOFR_CONNECTOR.id,
      path: "/Books",
      providerCredentials: { password: PASSWORD },
    })

  beforeEach(async () => {
    createNanoInstanceForUser.mockResolvedValue(createSettingsDb())
    listWebdavDirectory.mockResolvedValue([BOOKS_DIRECTORY, DUNE_FILE])

    const module = await Test.createTestingModule({
      controllers: [ConnectorsController],
      providers: [
        ConnectorsService,
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
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
          useValue: { getJwtPublicKey: async () => "public key" },
        },
      ],
    }).compile()

    app = module.createNestApplication({ logger: false })
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    vi.clearAllMocks()
  })

  it("lists the directory from the server of the reader's connector, with the password the app sends", async () => {
    const response = await listBooksDirectory()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      items: [
        {
          filename: "/Books/Comics",
          basename: "Comics",
          type: "directory",
        },
        {
          filename: "/Books/Dune.epub",
          basename: "Dune.epub",
          type: "file",
          mime: "application/epub+zip",
          etag: "dune-etag",
        },
      ],
    })
    expect(createNanoInstanceForUser).toHaveBeenCalledWith({
      email: readerTokenPayload.name,
    })
    expect(listWebdavDirectory).toHaveBeenCalledWith({
      connector: KOOFR_CONNECTOR,
      password: PASSWORD,
      path: "/Books",
      signal: expect.any(AbortSignal),
    })
  })

  it("answers 400 for a connector the settings do not hold, reaching no server", async () => {
    createNanoInstanceForUser.mockResolvedValue(createSettingsDb([]))

    const response = await listBooksDirectory()

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND },
      ],
    })
    expect(listWebdavDirectory).not.toHaveBeenCalled()
  })

  it("answers 400 without a password, reaching no server", async () => {
    const response = await listDirectory({
      connectorId: KOOFR_CONNECTOR.id,
      path: "/Books",
      providerCredentials: {},
    })

    expect(response.status).toBe(400)
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
    expect(listWebdavDirectory).not.toHaveBeenCalled()
  })

  it.each(SERVER_FAILURES)(
    "answers %s when the WebDAV server lists the directory",
    async (_, serverFailure, routeStatus, code) => {
      listWebdavDirectory.mockRejectedValue(serverFailure)

      const response = await listBooksDirectory()

      expect(response.status).toBe(routeStatus)
      expect(response.body).toEqual({ errors: [{ code }] })
    },
  )
})
