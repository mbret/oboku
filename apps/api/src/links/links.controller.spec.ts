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
import { PluginsService } from "../plugins/plugins.service.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import { LinksController } from "./links.controller.js"
import { LinksService } from "./links.service.js"

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
const BOOK_BYTES = "epub bytes"
const WEBDAV_STAT_SIZE = 12

const createLibraryDb = (
  documents: ReadonlyArray<Record<string, unknown>>,
) => ({
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
  const getFileMetadata = vi.fn()
  const download = vi.fn()
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
        { provide: PluginsService, useValue: { getFileMetadata, download } },
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
    expect(download).toHaveBeenCalledWith({
      link: expect.objectContaining({ _id: WEBDAV_LINK._id }),
      providerCredentials: PROVIDER_CREDENTIALS,
      db: expect.anything(),
    })
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

  it("answers 404 for a link the reader's library does not hold", async () => {
    const response = await downloadLink("link-of-someone-else")

    expect(response.status).toBe(404)
    expect(download).not.toHaveBeenCalled()
  })

  it("answers 400 for a link that is not a WebDAV link", async () => {
    const response = await downloadLink(URI_LINK._id)

    expect(response.status).toBe(400)
    expect(getFileMetadata).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
  })

  it.each([
    [404, 404],
    [401, 502],
  ])(
    "answers the WebDAV server's %i, when it describes the file, with %i",
    async (serverStatus, routeStatus) => {
      getFileMetadata.mockRejectedValue(
        Object.assign(new Error(`Invalid response: ${serverStatus}`), {
          status: serverStatus,
        }),
      )

      const response = await downloadLink(WEBDAV_LINK._id)

      expect(response.status).toBe(routeStatus)
      expect(download).not.toHaveBeenCalled()
    },
  )

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
