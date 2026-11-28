import { PassThrough, Readable } from "node:stream"
import type { INestApplication } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Test } from "@nestjs/testing"
import { ObokuErrorCode } from "@oboku/shared"
import request from "supertest"
import type { App } from "supertest/types.js"
import { afterEach, describe, expect, it, vi } from "vitest"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { AuthGuard, type TokenPayload } from "../auth/auth.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { SecretsService } from "../config/SecretsService.js"
import { CouchService } from "../couch/couch.service.js"
import { EmailService } from "../email/EmailService.js"
import { readAttachment, startSmtpServer } from "../email/smtpServer.fixture.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { PluginsService } from "../plugins/plugins.service.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import {
  KINDLE_MAX_SENDS_PER_USER_PER_DAY,
  KindleDailySendsService,
} from "./kindle-daily-sends.service.js"
import { KindleController } from "./kindle.controller.js"
import { KindleService } from "./kindle.service.js"

const READER_SESSION = "reader-session"

const readerTokenPayload: TokenPayload = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  "couchdb.roles": [],
}

const SENDER_ADDRESS = "books@oboku.example"
const KINDLE_EMAIL = "reader_42@kindle.com"
const MAX_FILE_SIZE_BYTES = 1000
const MAX_CONCURRENT_SENDS = 2
const BOOK_BYTES = Buffer.from("epub bytes ".repeat(20))
const OVERSIZED_BOOK_BYTES = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1, "a")
const DRIVE_CREDENTIALS = { access_token: "drive-access-token" }

const DUNE_BOOK = {
  _id: "book-dune",
  rx_model: "book",
  links: ["link-dune"],
  metadata: [{ type: "link", title: "Dune.epub" }],
}

const DUNE_DRIVE_LINK = {
  _id: "link-dune",
  rx_model: "link",
  type: "DRIVE",
  book: "book-dune",
  data: { fileId: "drive-file-dune" },
}

const WEBDAV_BOOK = {
  _id: "book-webdav",
  rx_model: "book",
  links: ["link-webdav"],
  metadata: [{ type: "link", title: "Emma.pdf" }],
}

const WEBDAV_LINK = {
  _id: "link-webdav",
  rx_model: "link",
  type: "webdav",
  book: "book-webdav",
  data: { connectorId: "koofr", filePath: "/Books/Emma.pdf" },
}

const COMIC_BOOK = {
  _id: "book-comic",
  rx_model: "book",
  links: ["link-comic"],
  metadata: [{ type: "link", title: "Akira 01.cbz" }],
}

const COMIC_LINK = {
  _id: "link-comic",
  rx_model: "link",
  type: "DRIVE",
  book: "book-comic",
  data: { fileId: "drive-file-akira" },
}

const DEVICE_BOOK = {
  _id: "book-device",
  rx_model: "book",
  links: ["link-device"],
  metadata: [{ type: "link", title: "Local.epub" }],
}

const DEVICE_LINK = {
  _id: "link-device",
  rx_model: "link",
  type: "file",
  book: "book-device",
  data: {},
}

const BOOK_WITHOUT_LINK = {
  _id: "book-without-link",
  rx_model: "book",
  links: [],
  metadata: [{ type: "link", title: "Orphan.epub" }],
}

const LIBRARY = [
  DUNE_BOOK,
  DUNE_DRIVE_LINK,
  WEBDAV_BOOK,
  WEBDAV_LINK,
  COMIC_BOOK,
  COMIC_LINK,
  DEVICE_BOOK,
  DEVICE_LINK,
  BOOK_WITHOUT_LINK,
]

const createLibraryDb = (settings: Record<string, unknown>) => ({
  get: async () => ({ _id: "settings", ...settings }),
  find: async ({ selector }: { selector: Record<string, unknown> }) => ({
    docs: LIBRARY.filter(function matchesSelector(
      doc: Record<string, unknown>,
    ) {
      return Object.entries(selector).every(
        ([field, value]) => doc[field] === value,
      )
    }),
  }),
})

const streamBookBytes = async () => ({
  stream: Readable.from([BOOK_BYTES]),
  size: BOOK_BYTES.byteLength,
})

describe("KindleController", () => {
  let app: INestApplication<App>
  let smtpServer: Awaited<ReturnType<typeof startSmtpServer>>

  const createNanoInstanceForUser = vi.fn()
  const download = vi.fn()
  const reserveWithinQuotas = vi.fn()
  const adjust = vi.fn()

  const startApp = async ({
    smtpRefusals,
    isEmailDeliveryConfigured = true,
  }: {
    smtpRefusals?: Parameters<typeof startSmtpServer>[0]
    isEmailDeliveryConfigured?: boolean
  } = {}) => {
    smtpServer = await startSmtpServer(smtpRefusals)
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb({ kindleEmail: KINDLE_EMAIL }),
    )
    download.mockImplementation(streamBookBytes)
    reserveWithinQuotas.mockResolvedValue("reserved")
    adjust.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      controllers: [KindleController],
      providers: [
        KindleService,
        KindleDailySendsService,
        EmailService,
        ProxiedDownloadQuotaService,
        InMemoryTaskQueueService,
        {
          provide: AppConfigService,
          useValue: {
            NODE_ENV: "production",
            EMAIL_SMTP_HOST: isEmailDeliveryConfigured
              ? "127.0.0.1"
              : undefined,
            EMAIL_SMTP_PORT: smtpServer.port,
            EMAIL_FROM: SENDER_ADDRESS,
            EMAIL_FROM_NAME: "oboku",
            SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_BYTES,
            QUEUE_KINDLE_SENDS_MAX_CONCURRENT: MAX_CONCURRENT_SENDS,
          },
        },
        { provide: CouchService, useValue: { createNanoInstanceForUser } },
        { provide: PluginsService, useValue: { download } },
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
  }

  const sendBook = (
    bookId: string,
    providerCredentials: Record<string, string> = DRIVE_CREDENTIALS,
  ) =>
    request(app.getHttpServer())
      .post("/kindle/send")
      .set("Authorization", `Bearer ${READER_SESSION}`)
      .send({ bookId, providerCredentials })

  afterEach(async () => {
    await app.close()
    await smtpServer.close()
    vi.clearAllMocks()
  })

  it("emails the book's file, read from its source with the credentials sent, to the Kindle address of the reader's settings", async () => {
    await startApp()

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({})
    expect(createNanoInstanceForUser).toHaveBeenCalledWith({
      email: readerTokenPayload.name,
    })
    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        link: DUNE_DRIVE_LINK,
        providerCredentials: DRIVE_CREDENTIALS,
      }),
    )

    const [email] = smtpServer.receivedEmails

    if (!email) throw new Error("The SMTP server received no email")

    const attachment = readAttachment(email)

    expect(smtpServer.receivedEmails).toHaveLength(1)
    expect(email.from).toBe(SENDER_ADDRESS)
    expect(email.recipients).toEqual([KINDLE_EMAIL])
    expect(attachment.headers).toContain("filename=Dune.epub")
    expect(attachment.content.equals(BOOK_BYTES)).toBe(true)
  })

  it("reserves the size the source states on the reader's download quota", async () => {
    await startApp()

    await sendBook(DUNE_BOOK._id)

    expect(reserveWithinQuotas).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: readerTokenPayload.userId,
        bytes: BOOK_BYTES.byteLength,
      }),
    )
  })

  it("answers 401 without a session, reading no library", async () => {
    await startApp()

    const response = await request(app.getHttpServer())
      .post("/kindle/send")
      .send({ bookId: DUNE_BOOK._id, providerCredentials: DRIVE_CREDENTIALS })

    expect(response.status).toBe(401)
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
  })

  it("answers 400 on an instance that cannot send emails, reading no library", async () => {
    await startApp({ isEmailDeliveryConfigured: false })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_NOT_AVAILABLE }],
    })
    expect(createNanoInstanceForUser).not.toHaveBeenCalled()
  })

  it.each([
    ["no address", {}],
    ["an address on another domain", { kindleEmail: "reader@example.org" }],
    [
      "a list of addresses",
      { kindleEmail: `${KINDLE_EMAIL}, other@example.org` },
    ],
  ])(
    "answers 400 when the settings hold %s, reaching no source",
    async (_case, settings) => {
      await startApp()
      createNanoInstanceForUser.mockResolvedValue(createLibraryDb(settings))

      const response = await sendBook(DUNE_BOOK._id)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_ADDRESS_INVALID }],
      })
      expect(download).not.toHaveBeenCalled()
      expect(smtpServer.receivedEmails).toEqual([])
    },
  )

  it.each([
    ["a book the library does not hold", "book-of-someone-else"],
    ["a book with no link", BOOK_WITHOUT_LINK._id],
  ])("answers 404 for %s", async (_case, bookId) => {
    await startApp()

    const response = await sendBook(bookId)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND }],
    })
    expect(download).not.toHaveBeenCalled()
  })

  it("answers 400 for a book added from a device, reaching no source", async () => {
    await startApp()

    const response = await sendBook(DEVICE_BOOK._id)

    expect(response.status).toBe(400)
    expect(download).not.toHaveBeenCalled()
  })

  it("answers 400 for a file of a type Amazon does not accept, reaching no source", async () => {
    await startApp()

    const response = await sendBook(COMIC_BOOK._id)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TYPE_NOT_ACCEPTED },
      ],
    })
    expect(download).not.toHaveBeenCalled()
  })

  it("answers 413 for a file its source states over the limit, ending the download and reserving no quota", async () => {
    await startApp()
    const oversizedFile = Readable.from([OVERSIZED_BOOK_BYTES])
    download.mockResolvedValue({
      stream: oversizedFile,
      size: OVERSIZED_BOOK_BYTES.byteLength,
    })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TOO_LARGE }],
    })
    expect(oversizedFile.destroyed).toBe(true)
    expect(reserveWithinQuotas).not.toHaveBeenCalled()
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers 413 for a file of unstated size once it passes the limit, sending no email", async () => {
    await startApp()
    download.mockResolvedValue({
      stream: Readable.from([
        OVERSIZED_BOOK_BYTES.subarray(0, MAX_FILE_SIZE_BYTES),
        OVERSIZED_BOOK_BYTES.subarray(MAX_FILE_SIZE_BYTES),
      ]),
    })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TOO_LARGE }],
    })
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers 429 when the file would pass a download quota, sending no email", async () => {
    await startApp()
    reserveWithinQuotas.mockResolvedValue("quota-reached")

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(429)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_QUOTA_REACHED }],
    })
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers 429 once the reader used the sends of the day, reaching no source", async () => {
    await startApp()

    for (let send = 0; send < KINDLE_MAX_SENDS_PER_USER_PER_DAY; send++) {
      expect((await sendBook(DUNE_BOOK._id)).status).toBe(200)
    }

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(429)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_DAILY_LIMIT_REACHED },
      ],
    })
    expect(download).toHaveBeenCalledTimes(KINDLE_MAX_SENDS_PER_USER_PER_DAY)
    expect(smtpServer.receivedEmails).toHaveLength(
      KINDLE_MAX_SENDS_PER_USER_PER_DAY,
    )
  })

  it("does not count a failed send on the reader's sends of the day", async () => {
    await startApp()
    download.mockRejectedValue({ response: { status: 404 } })

    for (let send = 0; send < KINDLE_MAX_SENDS_PER_USER_PER_DAY; send++) {
      expect((await sendBook(DUNE_BOOK._id)).status).toBe(404)
    }

    download.mockImplementation(streamBookBytes)

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(200)
  })

  it.each([
    [
      "a file Drive does not find with 404",
      { response: { status: 404 } },
      404,
      ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
    ],
    [
      "a token Drive refuses with 502",
      { response: { status: 403 } },
      502,
      ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
    ],
    [
      "a rate limit of Dropbox with 503",
      { status: 429 },
      503,
      ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED,
    ],
    [
      "any other failure of the source with 502",
      new Error("socket hang up"),
      502,
      ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
    ],
  ])("answers %s", async (_case, sourceFailure, status, code) => {
    await startApp()
    download.mockRejectedValue(sourceFailure)

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(status)
    expect(response.body).toEqual({ errors: [{ code }] })
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers a connector's failure as the other routes of a connector do", async () => {
    await startApp()
    download.mockRejectedValue(
      Object.assign(new Error("Invalid response: 401"), { status: 401 }),
    )

    const response = await sendBook(WEBDAV_BOOK._id, {
      password: "koofr-app-password",
    })

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED },
      ],
    })
  })

  it("answers 502 with the source's failure, and sends no email, when the download fails part way", async () => {
    await startApp()
    download.mockResolvedValue({
      stream: Readable.from(
        (async function* yieldThenFail() {
          yield BOOK_BYTES.subarray(0, 10)

          throw new Error("The source stopped")
        })(),
      ),
    })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN }],
    })
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers 502 when the SMTP server refuses the message", async () => {
    await startApp({
      smtpRefusals: { dataRefusal: "552 Message size exceeds fixed limit" },
    })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED }],
    })
  })

  it("answers 502 when the SMTP server refuses the recipient, ending the download it never read", async () => {
    await startApp({
      smtpRefusals: { recipientRefusal: "550 Mailbox unavailable" },
    })
    const unreadFile = new PassThrough()
    download.mockResolvedValue({ stream: unreadFile })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED }],
    })
    expect(unreadFile.destroyed).toBe(true)
  })

  it("answers 502 when the SMTP server cannot be reached, ending the download it never read", async () => {
    await startApp()
    await smtpServer.close()
    const unreadFile = new PassThrough()
    download.mockResolvedValue({ stream: unreadFile })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED }],
    })
    expect(unreadFile.destroyed).toBe(true)
  })

  it("does not count a send the SMTP server refused on the reader's sends of the day", async () => {
    await startApp({
      smtpRefusals: { recipientRefusal: "550 Mailbox unavailable" },
    })

    for (let send = 0; send <= KINDLE_MAX_SENDS_PER_USER_PER_DAY; send++) {
      const response = await sendBook(DUNE_BOOK._id)

      expect(response.body).toEqual({
        errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED }],
      })
    }
  })

  it("runs two sends at a time, and starts the next when one ends", async () => {
    await startApp()
    const heldFiles = [new PassThrough(), new PassThrough(), new PassThrough()]
    const unreadFiles = [...heldFiles]
    download.mockImplementation(async function streamNextHeldFile() {
      return { stream: unreadFiles.shift() }
    })

    const responses = [DUNE_BOOK._id, DUNE_BOOK._id, DUNE_BOOK._id].map(
      (bookId) => sendBook(bookId).then((response) => response.status),
    )

    await vi.waitFor(() =>
      expect(download).toHaveBeenCalledTimes(MAX_CONCURRENT_SENDS),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(download).toHaveBeenCalledTimes(MAX_CONCURRENT_SENDS)

    heldFiles[0]?.end(BOOK_BYTES)

    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(3))

    heldFiles[1]?.end(BOOK_BYTES)
    heldFiles[2]?.end(BOOK_BYTES)

    expect(await Promise.all(responses)).toEqual([200, 200, 200])
    expect(smtpServer.receivedEmails).toHaveLength(3)
  })
})
