import { Readable } from "node:stream"
import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import {
  getFileNameFromContentDisposition,
  ObokuErrorCode,
} from "@oboku/shared"
import request from "supertest"
import type { App } from "supertest/types.js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService } from "../couch/couch.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { NonPublicAddressError } from "../http/publicAddress.js"
import {
  allowServers,
  basicAuthorization,
  forgetAllowedServers,
  password as catalogPassword,
  startServer,
} from "../plugins/opds/catalog.fixture.js"
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

const DRIVE_LINK = {
  _id: "link-drive",
  rx_model: "link",
  type: "DRIVE",
  book: "book-drive",
  data: { fileId: "drive-file-id" },
}

const PROVIDER_CREDENTIALS = { password: "koofr-app-password" }

const OPDS_FILE_PATH = "/opds/books/dune/file"

const createOpdsConnector = (catalogOrigin: string) => ({
  id: "komga",
  type: "opds",
  url: `${catalogOrigin}/opds`,
  username: "reader",
  passwordAsSecretId: "secret-komga",
  proxyThroughServer: true,
})

const createOpdsBookLink = ({
  catalogOrigin,
  length,
  connectorId = "komga",
}: {
  catalogOrigin: string
  length?: number
  connectorId?: string
}) => ({
  _id: "link-opds-dune",
  rx_model: "link",
  type: "opds",
  book: "book-dune",
  data: {
    connectorId,
    entryId: "urn:book:dune",
    title: "Dune",
    acquisition: {
      href: `${catalogOrigin}${OPDS_FILE_PATH}`,
      type: "application/epub+zip",
      length,
    },
  },
})

const KOOFR_CONNECTOR = {
  id: "koofr",
  type: "webdav",
  url: "https://app.koofr.net/dav/Koofr",
  username: "reader@example.com",
  passwordAsSecretId: "secret-koofr",
  proxyThroughServer: true,
}
const BOOK_BYTES = "epub bytes"
const EPUB_HEADERS = { "content-type": "application/epub+zip" }
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

  const downloadLink = (
    linkId: string,
    providerCredentials = PROVIDER_CREDENTIALS,
  ) =>
    request(app.getHttpServer())
      .post("/links/download")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send({ linkId, providerCredentials })

  const downloadLinkWithoutCredentials = (linkId: string) =>
    request(app.getHttpServer())
      .post("/links/download")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send({ linkId })

  beforeEach(async () => {
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb([WEBDAV_LINK, DRIVE_LINK]),
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
    expect(
      getFileNameFromContentDisposition(
        response.headers["content-disposition"],
      ),
    ).toBe("Dune.epub")
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

  it("answers 400 for a link whose connector the settings do not hold, reaching no server", async () => {
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb([WEBDAV_LINK, DRIVE_LINK], []),
    )

    const response = await downloadLink(WEBDAV_LINK._id)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND },
      ],
    })
    expect(createWebdavClient).not.toHaveBeenCalled()
  })

  it("answers 400 for a link that names no connector, reaching no server", async () => {
    const linkWithoutConnector = {
      ...WEBDAV_LINK,
      _id: "link-without-connector",
      data: { filePath: WEBDAV_LINK.data.filePath },
    }
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb([linkWithoutConnector]),
    )

    const response = await downloadLink(linkWithoutConnector._id)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED }],
    })
    expect(createWebdavClient).not.toHaveBeenCalled()
  })

  it("answers 400 for a WebDAV link without the connector's password, reaching no server", async () => {
    const response = await downloadLinkWithoutCredentials(WEBDAV_LINK._id)

    expect(response.status).toBe(400)
    expect(createWebdavClient).not.toHaveBeenCalled()
  })

  it("answers 400 for a link of a source the route does not serve", async () => {
    const response = await downloadLink(DRIVE_LINK._id)

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

  describe("an OPDS book", () => {
    const CATALOG_CREDENTIALS = { password: catalogPassword }

    afterEach(forgetAllowedServers)

    const serveCatalog = async ({
      fileRoute,
      length,
      connectorId,
      isAllowed = true,
    }: {
      fileRoute: Parameters<typeof startServer>[0][string]
      length?: number
      connectorId?: string
      isAllowed?: boolean
    }) => {
      const catalog = await startServer({ [OPDS_FILE_PATH]: fileRoute })
      const link = createOpdsBookLink({
        catalogOrigin: catalog.origin,
        length,
        connectorId,
      })
      createNanoInstanceForUser.mockResolvedValue(
        createLibraryDb([link], [createOpdsConnector(catalog.origin)]),
      )
      if (isAllowed) allowServers(catalog)

      return { catalog, link }
    }

    it("streams the file from the catalog with the connector's credentials, asking for it uncompressed, and reserves the length the catalog's answer states", async () => {
      const { catalog, link } = await serveCatalog({
        fileRoute: {
          headers: {
            ...EPUB_HEADERS,
            "content-length": String(BOOK_BYTES.length),
          },
          body: BOOK_BYTES,
        },
        length: 1,
      })

      const response = await downloadLink(
        link._id,
        CATALOG_CREDENTIALS,
      ).responseType("blob")

      expect(response.status).toBe(200)
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(response.headers["content-length"]).toBe(String(BOOK_BYTES.length))
      expect(
        getFileNameFromContentDisposition(
          response.headers["content-disposition"],
        ),
      ).toBe("Dune")
      expect(catalog.onRequest.mock.calls).toEqual([
        [{ path: OPDS_FILE_PATH, authorization: basicAuthorization }],
      ])
      expect(catalog.onRequestHeaders).toHaveBeenCalledWith(
        expect.objectContaining({ "accept-encoding": "identity" }),
      )
      expect(reserveWithinQuotas).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: readerTokenPayload.userId,
          bytes: BOOK_BYTES.length,
        }),
      )
    })

    it("reserves the length the feed states when the catalog's answer states none", async () => {
      const { link } = await serveCatalog({
        fileRoute: { headers: EPUB_HEADERS, body: BOOK_BYTES },
        length: BOOK_BYTES.length,
      })

      const response = await downloadLink(
        link._id,
        CATALOG_CREDENTIALS,
      ).responseType("blob")

      expect(response.status).toBe(200)
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(response.headers["content-length"]).toBeUndefined()
      expect(reserveWithinQuotas).toHaveBeenCalledWith(
        expect.objectContaining({ bytes: BOOK_BYTES.length }),
      )
    })

    it("fails the download, and closes the catalog's answer, once the catalog sends more than the length the feed states", async () => {
      const { catalog, link } = await serveCatalog({
        fileRoute: {
          headers: EPUB_HEADERS,
          body: BOOK_BYTES,
          keepsAnswerOpen: true,
        },
        length: 4,
      })

      const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

      expect(response.status).toBe(502)
      await expect
        .poll(() => catalog.onAnswerClosed.mock.calls)
        .toEqual([[OPDS_FILE_PATH]])
    })

    it.each([
      [
        "neither the catalog's answer nor the feed states a size",
        {},
        undefined,
      ],
      [
        "the catalog's answer states a length of 0",
        { "content-length": "0" },
        BOOK_BYTES.length,
      ],
    ])(
      "answers 502, and closes the catalog's answer, when %s",
      async (_, sizeHeaders, length) => {
        const { catalog, link } = await serveCatalog({
          fileRoute: {
            headers: { ...EPUB_HEADERS, ...sizeHeaders },
            keepsAnswerOpen: true,
          },
          length,
        })

        const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

        expect(response.status).toBe(502)
        expect(response.body).toEqual({
          errors: [
            { code: ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_SIZE_UNKNOWN },
          ],
        })
        await expect
          .poll(() => catalog.onAnswerClosed.mock.calls)
          .toEqual([[OPDS_FILE_PATH]])
        expect(reserveWithinQuotas).not.toHaveBeenCalled()
      },
    )

    it.each([
      [404, 404, ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND],
      [401, 502, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED],
      [403, 502, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED],
      [500, 502, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE],
    ])(
      "answers a catalog's %i with %i and its code",
      async (catalogStatus, routeStatus, code) => {
        const { link } = await serveCatalog({
          fileRoute: { status: catalogStatus },
          length: BOOK_BYTES.length,
        })

        const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

        expect(response.status).toBe(routeStatus)
        expect(response.body).toEqual({ errors: [{ code }] })
        expect(reserveWithinQuotas).not.toHaveBeenCalled()
      },
    )

    it("answers 400 for a catalog on an address the instance does not reach, reaching no server", async () => {
      const { catalog, link } = await serveCatalog({
        fileRoute: { headers: EPUB_HEADERS, body: BOOK_BYTES },
        length: BOOK_BYTES.length,
        isAllowed: false,
      })

      const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED }],
      })
      expect(catalog.onRequest).not.toHaveBeenCalled()
    })

    it("answers 400 for a link that names no connector, reaching no server", async () => {
      const { catalog, link } = await serveCatalog({
        fileRoute: { headers: EPUB_HEADERS, body: BOOK_BYTES },
        length: BOOK_BYTES.length,
        connectorId: "",
      })

      const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED }],
      })
      expect(catalog.onRequest).not.toHaveBeenCalled()
    })

    it("names the file as the catalog's Content-Disposition does", async () => {
      const { link } = await serveCatalog({
        fileRoute: {
          headers: {
            ...EPUB_HEADERS,
            "content-disposition": 'attachment; filename="Dune (1965).epub"',
          },
          body: BOOK_BYTES,
        },
        length: BOOK_BYTES.length,
      })

      const response = await downloadLink(link._id, CATALOG_CREDENTIALS)

      expect(
        getFileNameFromContentDisposition(
          response.headers["content-disposition"],
        ),
      ).toBe("Dune (1965).epub")
    })

    it("answers 400 without the connector's password, reaching no server", async () => {
      const { catalog, link } = await serveCatalog({
        fileRoute: { headers: EPUB_HEADERS, body: BOOK_BYTES },
        length: BOOK_BYTES.length,
      })

      const response = await downloadLinkWithoutCredentials(link._id)

      expect(response.status).toBe(400)
      expect(catalog.onRequest).not.toHaveBeenCalled()
    })

    it("answers 400 for the link of an OPDS folder", async () => {
      const folderLink = {
        _id: "link-opds-series",
        rx_model: "link",
        type: "opds",
        book: "book-dune",
        data: {
          connectorId: "komga",
          feedUrl: "https://komga.example.com/opds/series/1",
          title: "Dune",
        },
      }
      createNanoInstanceForUser.mockResolvedValue(createLibraryDb([folderLink]))

      const response = await downloadLink(folderLink._id, CATALOG_CREDENTIALS)

      expect(response.status).toBe(400)
    })
  })

  describe("a web address", () => {
    const BOOK_PATH = "/books/45646578"

    afterEach(forgetAllowedServers)

    const serveBook = async ({
      fileRoute,
      isAllowed = true,
    }: {
      fileRoute: Parameters<typeof startServer>[0][string]
      isAllowed?: boolean
    }) => {
      const server = await startServer({ [BOOK_PATH]: fileRoute })
      const link = {
        _id: "link-web-dune",
        rx_model: "link",
        type: "URI",
        book: "book-dune",
        data: { url: `${server.origin}${BOOK_PATH}`, proxyThroughServer: true },
      }
      createNanoInstanceForUser.mockResolvedValue(createLibraryDb([link]))
      if (isAllowed) allowServers(server)

      return { server, link }
    }

    it("streams the file as the server sends it, with no credentials, asking for it uncompressed", async () => {
      const { server, link } = await serveBook({
        fileRoute: {
          headers: {
            ...EPUB_HEADERS,
            "content-length": String(BOOK_BYTES.length),
          },
          body: BOOK_BYTES,
        },
      })

      const response = await downloadLinkWithoutCredentials(
        link._id,
      ).responseType("blob")

      expect(response.status).toBe(200)
      expect(response.body.toString()).toBe(BOOK_BYTES)
      expect(response.headers["content-type"]).toBe(
        EPUB_HEADERS["content-type"],
      )
      expect(
        getFileNameFromContentDisposition(
          response.headers["content-disposition"],
        ),
      ).toBe("45646578")
      expect(server.onRequest.mock.calls).toEqual([
        [{ path: BOOK_PATH, authorization: undefined }],
      ])
      expect(server.onRequestHeaders).toHaveBeenCalledWith(
        expect.objectContaining({ "accept-encoding": "identity" }),
      )
      expect(reserveWithinQuotas).toHaveBeenCalledWith(
        expect.objectContaining({ bytes: BOOK_BYTES.length }),
      )
    })

    it("names the file as the server's Content-Disposition does", async () => {
      const { link } = await serveBook({
        fileRoute: {
          headers: {
            ...EPUB_HEADERS,
            "content-length": String(BOOK_BYTES.length),
            "content-disposition": 'attachment; filename="Dune.epub"',
          },
          body: BOOK_BYTES,
        },
      })

      const response = await downloadLinkWithoutCredentials(link._id)

      expect(
        getFileNameFromContentDisposition(
          response.headers["content-disposition"],
        ),
      ).toBe("Dune.epub")
    })

    it("answers 502, and closes the server's answer, when the answer states no size", async () => {
      const { server, link } = await serveBook({
        fileRoute: { headers: EPUB_HEADERS, keepsAnswerOpen: true },
      })

      const response = await downloadLinkWithoutCredentials(link._id)

      expect(response.status).toBe(502)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_SIZE_UNKNOWN }],
      })
      await expect
        .poll(() => server.onAnswerClosed.mock.calls)
        .toEqual([[BOOK_PATH]])
      expect(reserveWithinQuotas).not.toHaveBeenCalled()
    })

    it.each([
      [404, 404, ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND],
      [401, 502, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE],
      [403, 502, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE],
    ])(
      "answers a server's %i with %i and its code, and closes the answer",
      async (serverStatus, routeStatus, code) => {
        const { server, link } = await serveBook({
          fileRoute: { status: serverStatus, keepsAnswerOpen: true },
        })

        const response = await downloadLinkWithoutCredentials(link._id)

        expect(response.status).toBe(routeStatus)
        expect(response.body).toEqual({ errors: [{ code }] })
        await expect
          .poll(() => server.onAnswerClosed.mock.calls)
          .toEqual([[BOOK_PATH]])
      },
    )

    it("answers 502 for an address that is not http(s)", async () => {
      const fileLink = {
        _id: "link-web-file",
        rx_model: "link",
        type: "URI",
        book: "book-dune",
        data: { url: "file:///etc/passwd", proxyThroughServer: true },
      }
      createNanoInstanceForUser.mockResolvedValue(createLibraryDb([fileLink]))

      const response = await downloadLinkWithoutCredentials(fileLink._id)

      expect(response.status).toBe(502)
      expect(reserveWithinQuotas).not.toHaveBeenCalled()
    })

    it("answers 400 for an address the instance does not reach, reaching no server", async () => {
      const { server, link } = await serveBook({
        fileRoute: { headers: EPUB_HEADERS, body: BOOK_BYTES },
        isAllowed: false,
      })

      const response = await downloadLinkWithoutCredentials(link._id)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED }],
      })
      expect(server.onRequest).not.toHaveBeenCalled()
    })
  })
})
