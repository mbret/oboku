import { PassThrough, Readable } from "node:stream"
import { type INestApplication, Logger } from "@nestjs/common"
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
import { KindleDailySendsService } from "./kindle-daily-sends.service.js"
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
const MAX_SENDS_PER_DAY = 3
const SHORT_SEND_MAX_DURATION_MS = 100
const SHORT_SOURCE_IDLE_MS = 100
const KINDLE_SENDS_QUEUE = "kindle.sends"
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

const BOOK_WITH_MISLEADING_METADATA = {
  _id: "book-misleading",
  rx_model: "book",
  links: ["link-misleading"],
  metadata: [
    {
      type: "link",
      title: "Notes\r\nBcc: other@example.org.txt",
      contentType: "text/html\r\nBcc: other@example.org",
    },
  ],
}

const MISLEADING_LINK = {
  _id: "link-misleading",
  rx_model: "link",
  type: "DRIVE",
  book: "book-misleading",
  data: { fileId: "drive-file-notes" },
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
  BOOK_WITH_MISLEADING_METADATA,
  MISLEADING_LINK,
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

const toFileMetadata = (size?: number) => ({
  modifiedAt: "2026-11-16T08:00:00.000Z",
  bookMetadata: { size: size === undefined ? undefined : String(size) },
})

describe("KindleController", () => {
  let app: INestApplication<App>
  let smtpServer: Awaited<ReturnType<typeof startSmtpServer>>

  const createNanoInstanceForUser = vi.fn()
  let taskQueueService: InMemoryTaskQueueService

  const getFileMetadata = vi.fn()
  const download = vi.fn()
  const reserveWithinQuotas = vi.fn()
  const adjust = vi.fn()

  const startApp = async ({
    smtpRefusals,
    isEmailDeliveryConfigured = true,
    sendMaxDurationMs = 60_000,
    maxSourceIdleMs = 60_000,
  }: {
    smtpRefusals?: Parameters<typeof startSmtpServer>[0]
    isEmailDeliveryConfigured?: boolean
    sendMaxDurationMs?: number
    maxSourceIdleMs?: number
  } = {}) => {
    smtpServer = await startSmtpServer(smtpRefusals)
    createNanoInstanceForUser.mockResolvedValue(
      createLibraryDb({ kindleEmail: KINDLE_EMAIL }),
    )
    getFileMetadata.mockResolvedValue(toFileMetadata(BOOK_BYTES.byteLength))
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
            EMAIL_SMTP_SOCKET_TIMEOUT_MS: 20_000,
            SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_BYTES,
            QUEUE_KINDLE_SENDS_MAX_CONCURRENT: MAX_CONCURRENT_SENDS,
            SEND_TO_KINDLE_MAX_SENDS_PER_DAY: MAX_SENDS_PER_DAY,
            QUEUE_KINDLE_SENDS_MAX_DURATION_MS: sendMaxDurationMs,
            QUEUE_KINDLE_SENDS_MAX_SOURCE_IDLE_MS: maxSourceIdleMs,
          },
        },
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
    taskQueueService = module.get(InMemoryTaskQueueService)
  }

  const sendBook = (
    bookId: string,
    providerCredentials: Record<string, unknown> = DRIVE_CREDENTIALS,
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

  it("emails the file as the type of its extension, whatever type and name its metadata states, to the one recipient", async () => {
    await startApp()

    const response = await sendBook(BOOK_WITH_MISLEADING_METADATA._id)

    const [email] = smtpServer.receivedEmails

    if (!email) throw new Error("The SMTP server received no email")

    const attachment = readAttachment(email)

    expect(response.status).toBe(200)
    expect(email.recipients).toEqual([KINDLE_EMAIL])
    expect(attachment.headers).toContain("Content-Type: text/plain")
    expect(email.data).not.toMatch(/^Bcc:/m)
    expect(email.data).not.toContain("text/html")
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

  it("reserves the size the source states for the file when its download states none", async () => {
    await startApp()
    download.mockResolvedValue({ stream: Readable.from([BOOK_BYTES]) })

    await sendBook(DUNE_BOOK._id)

    expect(reserveWithinQuotas).toHaveBeenCalledWith(
      expect.objectContaining({ bytes: BOOK_BYTES.byteLength }),
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

  it("answers 400 for credentials that are not those of the book's source, reaching no source", async () => {
    await startApp()

    const response = await sendBook(DUNE_BOOK._id, { access_token: 42 })

    expect(response.status).toBe(400)
    expect(getFileMetadata).not.toHaveBeenCalled()
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

  it("answers 413 for a file its source states over the limit, opening no download", async () => {
    await startApp()
    getFileMetadata.mockResolvedValue(
      toFileMetadata(OVERSIZED_BOOK_BYTES.byteLength),
    )

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TOO_LARGE }],
    })
    expect(download).not.toHaveBeenCalled()
    expect(reserveWithinQuotas).not.toHaveBeenCalled()
  })

  it("answers 413 for a download that states a size over the limit, ending it and reserving no quota", async () => {
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
    getFileMetadata.mockResolvedValue(toFileMetadata())
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

    for (let send = 0; send < MAX_SENDS_PER_DAY; send++) {
      expect((await sendBook(DUNE_BOOK._id)).status).toBe(200)
    }

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(429)
    expect(response.body).toEqual({
      errors: [
        { code: ObokuErrorCode.ERROR_SEND_TO_KINDLE_DAILY_LIMIT_REACHED },
      ],
    })
    expect(download).toHaveBeenCalledTimes(MAX_SENDS_PER_DAY)
    expect(smtpServer.receivedEmails).toHaveLength(MAX_SENDS_PER_DAY)
  })

  it("does not count a failed send on the reader's sends of the day", async () => {
    await startApp()
    download.mockRejectedValue({ response: { status: 404 } })

    for (let send = 0; send < MAX_SENDS_PER_DAY; send++) {
      expect((await sendBook(DUNE_BOOK._id)).status).toBe(404)
    }

    download.mockImplementation(streamBookBytes)

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(200)
  })

  it("answers the source's failure when it refuses the file's download", async () => {
    await startApp()
    download.mockRejectedValue({ response: { status: 404 } })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND }],
    })
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("answers the source's failure when it refuses to state the file's size, opening no download", async () => {
    await startApp()
    getFileMetadata.mockRejectedValue({ response: { status: 403 } })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED }],
    })
    expect(download).not.toHaveBeenCalled()
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

  it("answers 502 with the source's failure when the download closes part way without an error", async () => {
    await startApp()
    const closedFile = new PassThrough()
    closedFile.write(BOOK_BYTES.subarray(0, 10))
    download.mockImplementation(async function streamThenClose() {
      setImmediate(function closeWithoutError() {
        closedFile.destroy()
      })

      return { stream: closedFile }
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

  it("logs the SMTP server's refusal by its codes, without the reply that repeats the Kindle address", async () => {
    await startApp({
      smtpRefusals: {
        recipientRefusal: `550 Mailbox ${KINDLE_EMAIL} unavailable`,
      },
    })
    const warn = vi.spyOn(Logger.prototype, "warn")

    await sendBook(DUNE_BOOK._id)

    const loggedLines = warn.mock.calls.map(([line]) => String(line))

    expect(loggedLines).toEqual([
      `The SMTP server refused book ${DUNE_BOOK._id}: code EENVELOPE, SMTP reply 550`,
    ])
    expect(loggedLines.join()).not.toContain(KINDLE_EMAIL)
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

  it("gives up on sources that do not answer in time, and sends the next book in the queue", async () => {
    await startApp({ sendMaxDurationMs: SHORT_SEND_MAX_DURATION_MS })
    const neverAnswered = new Promise<never>(function neverSettle() {})
    download
      .mockReturnValueOnce(neverAnswered)
      .mockReturnValueOnce(neverAnswered)

    const statuses = await Promise.all(
      [DUNE_BOOK._id, DUNE_BOOK._id, DUNE_BOOK._id].map((bookId) =>
        sendBook(bookId).then((response) => response.status),
      ),
    )

    expect(statuses).toEqual([502, 502, 200])
    expect(smtpServer.receivedEmails).toHaveLength(1)
  })

  it("answers 502 with the source's failure for a file that stops part way, before the SMTP server times out", async () => {
    await startApp({ maxSourceIdleMs: SHORT_SOURCE_IDLE_MS })
    const stalledFile = new PassThrough()
    stalledFile.write(BOOK_BYTES.subarray(0, 10))
    download.mockResolvedValue({ stream: stalledFile })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN }],
    })
    expect(stalledFile.destroyed).toBe(true)
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("gives up on a file that still arrives at the deadline, ending its download and sending no email", async () => {
    await startApp({ sendMaxDurationMs: SHORT_SEND_MAX_DURATION_MS })
    const slowFile = new PassThrough()
    const slowWrites = setInterval(function writeOneByte() {
      slowFile.write(BOOK_BYTES.subarray(0, 1))
    }, 10)
    slowFile.once("close", function stopWriting() {
      clearInterval(slowWrites)
    })
    getFileMetadata.mockResolvedValue(toFileMetadata())
    download.mockResolvedValue({ stream: slowFile })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      errors: [{ code: ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN }],
    })
    expect(slowFile.destroyed).toBe(true)
    expect(smtpServer.receivedEmails).toEqual([])
  })

  it("ends a download that answers after the send gave up on it", async () => {
    await startApp({ sendMaxDurationMs: SHORT_SEND_MAX_DURATION_MS })
    const lateFile = new PassThrough()
    download.mockImplementation(async function answerPastDeadline() {
      await new Promise((resolve) =>
        setTimeout(resolve, SHORT_SEND_MAX_DURATION_MS * 3),
      )

      return { stream: lateFile }
    })

    const response = await sendBook(DUNE_BOOK._id)

    expect(response.status).toBe(502)
    await vi.waitFor(() => expect(lateFile.destroyed).toBe(true))
  })

  it("runs two sends at a time, and starts the next when one ends", async () => {
    await startApp()
    const heldFiles = [new PassThrough(), new PassThrough(), new PassThrough()]
    getFileMetadata.mockResolvedValue(toFileMetadata())
    download
      .mockResolvedValueOnce({ stream: heldFiles[0] })
      .mockResolvedValueOnce({ stream: heldFiles[1] })
      .mockResolvedValueOnce({ stream: heldFiles[2] })

    const responses = [DUNE_BOOK._id, DUNE_BOOK._id, DUNE_BOOK._id].map(
      (bookId) => sendBook(bookId).then((response) => response.status),
    )

    await vi.waitFor(() =>
      expect(taskQueueService.getQueueStats(KINDLE_SENDS_QUEUE)).toMatchObject({
        activeCount: MAX_CONCURRENT_SENDS,
        pendingCount: 1,
      }),
    )
    await vi.waitFor(() =>
      expect(download).toHaveBeenCalledTimes(MAX_CONCURRENT_SENDS),
    )

    heldFiles[0]?.end(BOOK_BYTES)

    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(3))

    heldFiles[1]?.end(BOOK_BYTES)
    heldFiles[2]?.end(BOOK_BYTES)

    expect(await Promise.all(responses)).toEqual([200, 200, 200])
    expect(smtpServer.receivedEmails).toHaveLength(3)
  })
})
