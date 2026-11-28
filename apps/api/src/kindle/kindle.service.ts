import { extname } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common"
import {
  assertNever,
  isKindleEmail,
  type LinkDocType,
  ObokuErrorCode,
  type SourceApiCredentials,
  type SourceType,
} from "@oboku/shared"
import type createNano from "nano"
import { from, lastValueFrom } from "rxjs"
import type { AuthUser } from "../auth/auth.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CouchService } from "../couch/couch.service.js"
import { getSettings } from "../couch/dbHelpers.js"
import { findOne } from "../couch/findOne.js"
import { EmailService } from "../email/EmailService.js"
import { toAnsweredStatus } from "../http/answeredStatus.js"
import { toGoogleApiFailure } from "../http/googleApiFailure.js"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../http/obokuBadRequest.js"
import { toServedFile } from "../opds/opds-books.js"
import {
  createByteLimitTransform,
  FileDownloadSizeLimitExceededError,
  PluginsService,
} from "../plugins/plugins.service.js"
import { throwConnectorHttpException } from "../plugins/toConnectorHttpException.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { ProxiedDownloadQuotaService } from "../quotas/proxied-download-quota.service.js"
import { toSendToKindleConfig } from "./kindle-config.js"
import { KindleDailySendsService } from "./kindle-daily-sends.service.js"

const KINDLE_SENDS_QUEUE = "kindle.sends"

/**
 * The types Amazon accepts by email, among those oboku reads, with the media
 * type a file of each is emailed as.
 */
const KINDLE_CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, string> = new Map([
  [".epub", "application/epub+zip"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain"],
])

const KINDLE_EMAIL_SUBJECT = "A book from oboku"
const KINDLE_EMAIL_TEXT = "oboku sent the attached book to this Kindle."

/** The media type to email a file as, none when Amazon does not accept its type. */
const toKindleContentType = (fileName: string) =>
  KINDLE_CONTENT_TYPE_BY_EXTENSION.get(extname(fileName).toLowerCase())

const toReadable = (stream: NodeJS.ReadableStream) =>
  stream instanceof Readable ? stream : Readable.from(stream)

const rejectOnceAborted = (signal: AbortSignal) =>
  new Promise<never>(function waitForAbort(_resolve, reject) {
    signal.addEventListener(
      "abort",
      function rejectWithAbortReason() {
        reject(signal.reason)
      },
      { once: true },
    )
  })

const createFileTooLarge = () =>
  new PayloadTooLargeException(
    toObokuErrorBody(ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TOO_LARGE),
  )

const createTooManyRequests = (code: ObokuErrorCode) =>
  new HttpException(toObokuErrorBody(code), HttpStatus.TOO_MANY_REQUESTS)

/**
 * The status a source refused the download with. The Dropbox SDK puts it on
 * its error. gaxios, for Drive, and axios, for a web address, put it on the
 * error's `response`.
 */
const toRefusedStatus = (error: unknown) =>
  toAnsweredStatus(error) ?? toGoogleApiFailure(error).status

const toAccountSourceFailure = (error: unknown) => {
  const refusedStatus = toRefusedStatus(error)

  if (refusedStatus === 404) {
    return new NotFoundException(
      toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
    )
  }

  if (refusedStatus === 429) {
    return new ServiceUnavailableException(
      toObokuErrorBody(ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED),
    )
  }

  const isAccessRefused = refusedStatus === 401 || refusedStatus === 403

  return new BadGatewayException(
    toObokuErrorBody(
      isAccessRefused
        ? ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED
        : ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
    ),
  )
}

/** Throws what the route answers for a file its source would not send. */
const throwSourceFailure = (sourceType: SourceType, error: unknown): never => {
  switch (sourceType) {
    case "webdav":
    case "synology-drive":
    case "server":
    case "opds":
      return throwConnectorHttpException(error)
    case "DRIVE":
    case "dropbox":
    case "one-drive":
    case "URI":
    case "file":
      throw toAccountSourceFailure(error)
    default:
      return assertNever(sourceType)
  }
}

const isPrematureClose = (error: NodeJS.ErrnoException) =>
  error.code === "ERR_STREAM_PREMATURE_CLOSE"

type BookFileToEmail = {
  userId: number
  bookId: string
  db: createNano.DocumentScope<unknown>
  link: LinkDocType
  providerCredentials: SourceApiCredentials<SourceType>
  file: { name: string; contentType: string }
  kindleEmail: string
  maxFileSizeBytes: number
}

/** Emails a book's file to its owner's Kindle, with Amazon's Send to Kindle. */
@Injectable()
export class KindleService implements OnModuleInit {
  private readonly logger = new Logger(KindleService.name)

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly pluginsService: PluginsService,
    private readonly proxiedDownloadQuotaService: ProxiedDownloadQuotaService,
    private readonly emailService: EmailService,
    private readonly taskQueueService: InMemoryTaskQueueService,
    private readonly kindleDailySendsService: KindleDailySendsService,
  ) {}

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: KINDLE_SENDS_QUEUE,
      maxConcurrent: this.appConfigService.QUEUE_KINDLE_SENDS_MAX_CONCURRENT,
    })
  }

  /**
   * Reads the file of a book of the user's library from its source, with
   * `providerCredentials`, and emails it to the Send to Kindle address the
   * user's settings hold. It resolves once the SMTP server accepted the
   * message: Amazon can still reject the file later.
   *
   * The file's bytes count on the proxied download quotas, and the send on
   * the user's sends of the day, which a failed send gives back.
   *
   * @throws a 400 when the instance cannot send emails, the settings hold no
   * Send to Kindle address, the book was added from a device, or its file is
   * of a type Amazon does not accept; a 404 when the library has no such
   * book or its source no such file; a 413 for a file over the instance's
   * limit; a 429 once the user used the day's sends, or when the file would
   * pass a download quota; a 502 or 503 when the source or the SMTP server
   * refuses, or when the source has not sent the whole file within
   * `QUEUE_KINDLE_SENDS_MAX_DURATION_MS`.
   */
  async sendBook({
    user,
    bookId,
    providerCredentials,
  }: {
    user: Pick<AuthUser, "userId" | "email">
    bookId: string
    providerCredentials: SourceApiCredentials<SourceType>
  }) {
    const config = toSendToKindleConfig(this.appConfigService)

    if (!config) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_SEND_TO_KINDLE_NOT_AVAILABLE,
      )
    }

    const db = await this.couchService.createNanoInstanceForUser({
      email: user.email,
    })
    const [settings, book] = await Promise.all([
      getSettings(db),
      findOne("book", { selector: { _id: bookId } }, { db }),
    ])
    const firstLinkId = book?.links[0]
    const link = firstLinkId
      ? await findOne("link", { selector: { _id: firstLinkId } }, { db })
      : null
    const kindleEmail = settings?.kindleEmail

    if (!kindleEmail || !isKindleEmail(kindleEmail)) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_SEND_TO_KINDLE_ADDRESS_INVALID,
      )
    }

    if (!book || !link) {
      throw new NotFoundException(
        toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
      )
    }

    const isDeviceFile = link.type === "file"

    if (isDeviceFile) throw new BadRequestException()

    const { name: fileName } = toServedFile(book)
    const contentType = toKindleContentType(fileName)

    if (!contentType) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TYPE_NOT_ACCEPTED,
      )
    }

    const { userId } = user
    const { kindleDailySendsService } = this

    if (kindleDailySendsService.reserve(userId) === "limit-reached") {
      throw createTooManyRequests(
        ObokuErrorCode.ERROR_SEND_TO_KINDLE_DAILY_LIMIT_REACHED,
      )
    }

    const emailQueuedBookFile = () =>
      from(
        this.emailBookFile({
          userId,
          bookId,
          db,
          link,
          providerCredentials,
          file: { name: fileName, contentType },
          kindleEmail,
          maxFileSizeBytes: config.maxFileSizeBytes,
        }),
      )

    await lastValueFrom(
      this.taskQueueService.enqueue(KINDLE_SENDS_QUEUE, emailQueuedBookFile),
    ).catch(function giveBackFailedSend(error: unknown) {
      kindleDailySendsService.release(userId)

      throw error
    })
  }

  private async emailBookFile({
    userId,
    bookId,
    db,
    link,
    providerCredentials,
    file,
    kindleEmail,
    maxFileSizeBytes,
  }: BookFileToEmail) {
    const deadline = AbortSignal.timeout(
      this.appConfigService.QUEUE_KINDLE_SENDS_MAX_DURATION_MS,
    )
    const pendingDownload = this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })
    const download = await Promise.race([
      pendingDownload,
      rejectOnceAborted(deadline),
    ]).catch(function answerSourceFailure(error: unknown) {
      pendingDownload.then(
        function endDownloadAnsweredPastDeadline({ stream }) {
          toReadable(stream).destroy()
        },
        function ignoreFailedDownload() {},
      )

      return throwSourceFailure(link.type, error)
    })
    const source = toReadable(download.stream)
    const isStatedSizeOverLimit =
      download.size !== undefined && download.size > maxFileSizeBytes

    if (isStatedSizeOverLimit) {
      source.destroy()

      throw createFileTooLarge()
    }

    const meteredFile = await this.proxiedDownloadQuotaService.meter({
      userId,
      stream: source,
      expectedBytes: download.size,
      isBodySent: true,
    })

    if (meteredFile.status === "quota-reached") {
      throw createTooManyRequests(
        ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_QUOTA_REACHED,
      )
    }

    const attachment = createByteLimitTransform(maxFileSizeBytes)
    const fileFailure = pipeline(meteredFile.stream, attachment, {
      signal: deadline,
    }).then(
      function reportNoFailure() {
        return null
      },
      function reportFailure(error: NodeJS.ErrnoException) {
        return error
      },
    )

    try {
      await this.emailService.sendEmail({
        to: kindleEmail,
        subject: KINDLE_EMAIL_SUBJECT,
        text: KINDLE_EMAIL_TEXT,
        attachments: [
          {
            filename: file.name,
            contentType: file.contentType,
            content: attachment,
          },
        ],
      })
    } catch (emailError) {
      // The pipeline's own failure, if it had one, came first: this
      // premature close only ends a file that was still passing.
      attachment.destroy()

      const fileError = await fileFailure

      if (fileError instanceof FileDownloadSizeLimitExceededError) {
        throw createFileTooLarge()
      }

      const isFileFailed = fileError !== null && !isPrematureClose(fileError)

      if (isFileFailed) return throwSourceFailure(link.type, fileError)

      this.logger.warn(
        `The SMTP server refused book ${bookId}: ${emailError instanceof Error ? emailError.message : "unknown error"}`,
      )

      throw new BadGatewayException(
        toObokuErrorBody(ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED),
      )
    }

    this.logger.log(`Emailed book ${bookId} of user ${userId} to a Kindle`)
  }
}
