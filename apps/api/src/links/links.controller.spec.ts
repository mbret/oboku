import { Readable } from "node:stream"
import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import request from "supertest"
import type { App } from "supertest/types.js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService } from "../couch/couch.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { NonPublicAddressError } from "../http/publicAddress.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import { LinksController } from "./links.controller.js"
import { LinksService } from "./links.service.js"

const { getFileMetadata, download, createWebdavClient } = vi.hoisted(
  function createWebdavSpies() {
    return {
      getFileMetadata: vi.fn(),
      download: vi.fn(),
      createWebdavClient: vi.fn(),
    }
  },
)

vi.mock(
  "../plugins/webdav/index.js",
  async function spyOnWebdavClient(importOriginal) {
    const webdav =
      await importOriginal<typeof import("../plugins/webdav/index.js")>()
    createWebdavClient.mockImplementation(webdav.createWebdavClient)

    return { ...webdav, createWebdavClient }
  },
)

vi.mock(
  "../plugins/webdav/operations.js",
  async function mockWebdavOperations(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../plugins/webdav/operations.js")
      >()),
      getFileMetadataFromWebdav: getFileMetadata,
      downloadFromWebdav: download,
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

const WEBDAV_LINK = {
  _id: "link-dune",
  rx_model: "link",
  type: "webdav",
  book: "book-dune",
  data: { connectorId: "koofr", filePath: "/Books/Dune.epub" },
}

const URI_LINK = {
  _id: "link-uri",
  rx_model: "link",
  type: "URI",
  book: "book-uri",
  data: { url: "https://books.example.com/Dune.epub" },
}

const PROVIDER_CREDENTIALS = { password: "koofr-app-password" }

const KOOFR_CONNECTOR = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "secret-koofr",
  proxyThroughServer: true,
}
const BOOK_BYTES = "epub bytes"
const WEBDAV_STAT_SIZE = 12

const SERVER_FAILURES: ReadonlyArray<[string, Error, number, ObokuErrorCode]> =
  [
    [
      "a missing file with 404",
      Object.assign(new Error("Invalid response: 404"), { status: 404 }),
      404,
      ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
    ],
    [
      "a refused password (401) with 502",
      Object.assign(new Error("Invalid response: 401"), { status: 401 }),
      502,
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
    ],
    [
      "a refused password (403) with 502",
      Object.assign(new Error("Invalid response: 403"), { status: 403 }),
      502,
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
    ],
    [
      "a server it cannot reach with 502",
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      }),
      502,
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
    ],
    [
      "an address the instance does not reach with 400",
      new NonPublicAddressError("nas.local"),
      400,
      ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED,
    ],
  ]

const createLibraryDb = (
  documents: ReadonlyArray<Record<string, unknown>>,
  connectors: ReadonlyArray<Record<string, unknown>> = [KOOFR_CONNECTOR],
) => ({
  get: async () => ({ _id: "settings", connectors }),
  find: async ({ selector }: { selector: Record<string, unknown> }) => ({
    docs: documents.filter(function matchesSelector(doc) {
      return Object.entries(selector).every(
        ([field, value]) => doc[field] === value,
      )
    }),
  }),
})

describe("LinksController", () => {
  let app: INestApplication<App>

  const createNanoInstanceForUser = vi.fn()
  const reserveWithinQuotas = vi.fn()
  const adjust = vi.fn()

  const downloadLink = (linkId: string) =>
    request(app.getHttpServer())
      .post("/links/download")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send({ linkId, providerCredentials: PROVIDER_CREDENTIALS })

  beforeEach(async () => {
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb([WEBDAV_LINK, URI_LINK]),
    )
    getFileMetadata.mockResolvedValue({
      modifiedAt: "2026-11-16T08:00:00.000Z",
      bookMetadata: { size: String(WEBDAV_STAT_SIZE) },
    })
    download.mockImplementation(async function streamBook() {
      return { stream: Readable.from([Buffer.from(BOOK_BYTES)]) }
    })
    reserveWithinQuotas.mockResolvedValue("reserved")
    adjust.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        LinksService,
        ProxiedDownloadQuotaService,
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
        {
          provide: ProxiedDownloadUsagePostgresService,
          useValue: { reserveWithinQuotas, adjust },
        },
        {
          provide: InstanceConfigService,
          useValue: {
            getConfig: () => ({
              value: {
                proxiedDownloadBytesMaxPerMonth: 500 * 1000 ** 3,
                proxiedDownloadUserQuota: { type: "percentage", percent: 5 },
              },
            }),
          },
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
          useValue: { getJwtPublicKey: async () => "public key" },
        },
      ],
    }).compile()

    app = module.createNestApplication({ logger: false })
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    vi.clearAllMocks()
  })

  it("streams the file of a WebDAV link in the reader's library, reserving the size its server states on the reader's quota", async () => {
    const response = await downloadLink(WEBDAV_LINK._id).responseType("blob")

    expect(response.status).toBe(200)
    expect(response.body.toString()).toBe(BOOK_BYTES)
    expect(createNanoInstanceForUser).toHaveBeenCalledWith({
      email: readerTokenPayload.name,
    })
    expect(createWebdavClient).toHaveBeenCalledWith({
      ...KOOFR_CONNECTOR,
      password: PROVIDER_CREDENTIALS.password,
    })
    expect(download).toHaveBeenCalledWith(
      expect.anything(),
      WEBDAV_LINK.data.filePath,
    )
    expect(reserveWithinQuotas).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: readerTokenPayload.userId,
        bytes: WEBDAV_STAT_SIZE,
      }),
    )
    await vi.waitFor(() =>
      expect(adjust).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: readerTokenPayload.userId,
          bytes: BOOK_BYTES.length - WEBDAV_STAT_SIZE,
        }),
      ),
    )
  })

  it("states the length the server's download states, and reserves it rather than the size its metadata states", async () => {
    download.mockResolvedValue({
      stream: Readable.from([Buffer.from(BOOK_BYTES)]),
      size: BOOK_BYTES.length,
    })

    const response = await downloadLink(WEBDAV_LINK._id).responseType("blob")

    expect(response.status).toBe(200)
    expect(response.headers["content-length"]).toBe(String(BOOK_BYTES.length))
    expect(reserveWithinQuotas).toHaveBeenCalledWith(
      expect.objectContaining({ bytes: BOOK_BYTES.length }),
    )
  })

  it("answers 404 for a link the reader's library does not hold", async () => {
    const response = await downloadLink("link-of-someone-else")

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND }],
    })
    expect(download).not.toHaveBeenCalled()
  })

  it("answers 502 for a link whose connector the settings no longer hold, reaching no server", async () => {
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb([WEBDAV_LINK, URI_LINK], []),
    )

    const response = await downloadLink(WEBDAV_LINK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE },
      ],
    })
    expect(createWebdavClient).not.toHaveBeenCalled()
  })

  it("answers 400 for a link that is not a WebDAV link", async () => {
    const response = await downloadLink(URI_LINK._id)

    expect(response.status).toBe(400)
    expect(getFileMetadata).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
  })

  it.each(SERVER_FAILURES)(
    "answers %s when the WebDAV server describes the file",
    async (_, serverFailure, routeStatus, code) => {
      getFileMetadata.mockRejectedValue(serverFailure)

      const response = await downloadLink(WEBDAV_LINK._id)

      expect(response.status).toBe(routeStatus)
      expect(response.body).toEqual({ errors: [{ code }] })
      expect(download).not.toHaveBeenCalled()
    },
  )

  it.each(SERVER_FAILURES)(
    "answers %s when the WebDAV server sends the file",
    async (_, serverFailure, routeStatus, code) => {
      download.mockRejectedValue(serverFailure)

      const response = await downloadLink(WEBDAV_LINK._id)

      expect(response.status).toBe(routeStatus)
      expect(response.body).toEqual({ errors: [{ code }] })
      expect(reserveWithinQuotas).not.toHaveBeenCalled()
    },
  )

  it.each([
    ["no size", {}],
    ["a size of 0", { size: "0" }],
  ])(
    "answers 502 when the WebDAV server states %s for the file",
    async (_, bookMetadata) => {
      getFileMetadata.mockResolvedValue({
        modifiedAt: "2026-11-16T08:00:00.000Z",
        bookMetadata,
      })

      const response = await downloadLink(WEBDAV_LINK._id)

      expect(response.status).toBe(502)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_SIZE_UNKNOWN }],
      })
      expect(download).not.toHaveBeenCalled()
    },
  )

  it("answers 502 with a code, and names no file, when the WebDAV stream fails before its first byte", async () => {
    download.mockResolvedValue({
      stream: new Readable({
        read() {
          this.destroy(
            Object.assign(new Error("aborted"), { code: "ECONNRESET" }),
          )
        },
      }),
    })

    const response = await downloadLink(WEBDAV_LINK._id)

    expect(response.status).toBe(502)
    expect(response.headers["content-disposition"]).toBeUndefined()
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE },
      ],
    })
  })

  it("cuts the file once the WebDAV server sends more than the size it states", async () => {
    getFileMetadata.mockResolvedValue({
      modifiedAt: "2026-11-16T08:00:00.000Z",
      bookMetadata: { size: "4" },
    })
    const providerStream = Readable.from([
      Buffer.from("epu"),
      Buffer.from("b bytes"),
    ])
    download.mockResolvedValue({ stream: providerStream })

    await expect(
      downloadLink(WEBDAV_LINK._id).responseType("blob"),
    ).rejects.toThrow("aborted")
    expect(providerStream.destroyed).toBe(true)
    await vi.waitFor(() =>
      expect(adjust).toHaveBeenCalledWith(
        expect.objectContaining({ bytes: -1 }),
      ),
    )
  })

  it("answers 429 with the quota's error code until the next month once the download would pass a quota", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-12-31T23:30:00.000Z"))
    reserveWithinQuotas.mockResolvedValue("quota-reached")
    const providerStream = Readable.from([Buffer.from(BOOK_BYTES)])
    download.mockResolvedValue({ stream: providerStream })

    try {
      const response = await downloadLink(WEBDAV_LINK._id)

      expect(response.status).toBe(429)
      expect(response.headers["retry-after"]).toBe(
        "Fri, 01 Jan 2027 00:00:00 GMT",
      )
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_QUOTA_REACHED }],
      })
      expect(providerStream.destroyed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
