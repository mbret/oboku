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
} from "@nestjs/common"
import {
  isKindleEmail,
  type LinkDocType,
  ObokuErrorCode,
  parseSourceApiCredentials,
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
import { toByteCount } from "../http/contentLength.js"
import { isRecord } from "../http/isRecord.js"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../http/obokuBadRequest.js"
import { toServedFile } from "../opds/opds-books.js"
import { failOnceSourceStalls } from "../plugins/failOnceSourceStalls.js"
import {
  createByteLimitTransform,
  FileDownloadSizeLimitExceededError,
  PluginsService,
} from "../plugins/plugins.service.js"
import { throwSourceHttpException } from "../plugins/toSourceHttpException.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import {
  createProxiedDownloadQuotaReached,
  ProxiedDownloadQuotaService,
} from "../quotas/proxied-download-quota.service.js"
import { toSendToKindleConfig } from "./kindle-config.js"
import { KindleDailySendsService } from "./kindle-daily-sends.service.js"

const KINDLE_SENDS_QUEUE = "kindle.sends"

/** The types Amazon accepts by email, among those oboku reads. */
const KINDLE_CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, string> = new Map([
  [".epub", "application/epub+zip"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain"],
])

const KINDLE_EMAIL_SUBJECT = "A book from oboku"
const KINDLE_EMAIL_TEXT = "oboku sent the attached book to this Kindle."

const toKindleContentType = (fileName: string) =>
  KINDLE_CONTENT_TYPE_BY_EXTENSION.get(extname(fileName).toLowerCase())

const areSourceCredentialsValid = (
  sourceType: SourceType,
  providerCredentials: unknown,
) => {
  try {
    parseSourceApiCredentials(sourceType, providerCredentials)

    return true
  } catch {
    return false
  }
}

const toReadable = (stream: NodeJS.ReadableStream) =>
  stream instanceof Readable ? stream : Readable.from(stream)

/**
 * Settles as `pending` does, unless `signal` aborts first: it then rejects
 * with the signal's reason. It stops listening to the signal once `pending`
 * settles, so the signal does not keep what `pending` resolved with.
 */
const settleUnlessAborted = <TValue>(
  pending: Promise<TValue>,
  signal: AbortSignal,
) =>
  new Promise<TValue>(function raceWithAbort(resolve, reject) {
    const rejectWithAbortReason = () => reject(signal.reason)

    signal.addEventListener("abort", rejectWithAbortReason, { once: true })
    pending.then(resolve, reject).finally(function stopListeningToAbort() {
      signal.removeEventListener("abort", rejectWithAbortReason)
    })
  })

const createFileTooLarge = () =>
  new PayloadTooLargeException(
    toObokuErrorBody(ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TOO_LARGE),
  )

/** nodemailer's message repeats the SMTP server's reply, which can hold the recipient. */
const toSmtpFailureSummary = (error: unknown) =>
  isRecord(error)
    ? `code ${String(error.code ?? "none")}, SMTP reply ${String(error.responseCode ?? "none")}`
    : "unknown failure"

type LinkFile = {
  db: createNano.DocumentScope<unknown>
  link: LinkDocType
  providerCredentials: SourceApiCredentials<SourceType>
  maxFileSizeBytes: number
}

type BookFileToEmail = LinkFile & {
  userId: number
  bookId: string
  file: { name: string; contentType: string }
  kindleEmail: string
}

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

  /** Resolves once the SMTP server accepted the message: Amazon can still reject the file later. */
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

    if (!areSourceCredentialsValid(link.type, providerCredentials)) {
      throw new BadRequestException()
    }

    const { name: fileName } = toServedFile(book)
    const contentType = toKindleContentType(fileName)

    if (!contentType) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_SEND_TO_KINDLE_FILE_TYPE_NOT_ACCEPTED,
      )
    }

    const { userId } = user
    const giveBackSend = this.kindleDailySendsService.reserve(userId)

    if (!giveBackSend) {
      throw new HttpException(
        toObokuErrorBody(
          ObokuErrorCode.ERROR_SEND_TO_KINDLE_DAILY_LIMIT_REACHED,
        ),
        HttpStatus.TOO_MANY_REQUESTS,
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
      this.taskQueueService.enqueue(KINDLE_SENDS_QUEUE, emailQueuedBookFile, {
        id: bookId,
      }),
    ).catch(function giveBackFailedSend(error: unknown) {
      giveBackSend()

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
    const download = await this.openDownload(
      { db, link, providerCredentials, maxFileSizeBytes },
      deadline,
    )
    const meteredFile = await this.proxiedDownloadQuotaService.meter({
      userId,
      stream: download.stream,
      expectedBytes: download.expectedSize,
      isBodySent: true,
    })

    if (meteredFile.status === "quota-reached") {
      throw createProxiedDownloadQuotaReached()
    }

    const maxSourceIdleMs =
      this.appConfigService.QUEUE_KINDLE_SENDS_MAX_SOURCE_IDLE_MS
    const attachment = createByteLimitTransform(maxFileSizeBytes)

    pipeline(
      meteredFile.stream,
      function failOnceStalled(metered: AsyncIterable<Buffer>) {
        return failOnceSourceStalls(metered, maxSourceIdleMs)
      },
      attachment,
      { signal: deadline },
    ).catch(function readFileFailureFromAttachment() {})

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
      // Read before the streams end: nodemailer ends an attachment it gives
      // up on without an error, so an error here is the file's own failure.
      const fileError = attachment.errored

      download.stream.destroy()
      attachment.destroy()

      if (fileError instanceof FileDownloadSizeLimitExceededError) {
        throw createFileTooLarge()
      }

      if (fileError) return throwSourceHttpException(link.type, fileError)

      this.logger.warn(
        `The SMTP server refused book ${bookId}: ${toSmtpFailureSummary(emailError)}`,
      )

      throw new BadGatewayException(
        toObokuErrorBody(ObokuErrorCode.ERROR_SEND_TO_KINDLE_EMAIL_REFUSED),
      )
    }

    this.logger.log(`Emailed book ${bookId} of user ${userId} to a Kindle`)
  }

  /**
   * Opens the download of a link's file, unless its source states a size
   * over the limit. The size is asked first because a plugin can read a
   * whole file into memory before it gives its stream, as Dropbox's does.
   *
   * A source that has not answered at the deadline is given up on, and a
   * download it opens later is ended.
   */
  private async openDownload(
    { db, link, providerCredentials, maxFileSizeBytes }: LinkFile,
    deadline: AbortSignal,
  ) {
    const throwSourceFailure = (error: unknown) =>
      throwSourceHttpException(link.type, error)

    const { bookMetadata } = await settleUnlessAborted(
      this.pluginsService.getFileMetadata({ link, providerCredentials, db }),
      deadline,
    ).catch(throwSourceFailure)
    const statedSize = toByteCount(bookMetadata?.size)
    const isStatedSizeOverLimit =
      statedSize !== undefined && statedSize > maxFileSizeBytes

    if (isStatedSizeOverLimit) throw createFileTooLarge()

    const pendingDownload = this.pluginsService.download({
      link,
      providerCredentials,
      db,
    })
    const download = await settleUnlessAborted(pendingDownload, deadline).catch(
      function endLateDownload(error: unknown) {
        pendingDownload.then(
          function endDownloadOpenedPastDeadline({ stream }) {
            toReadable(stream).destroy()
          },
          function ignoreFailedDownload() {},
        )

        return throwSourceFailure(error)
      },
    )
    const stream = toReadable(download.stream)
    const isDownloadSizeOverLimit =
      download.size !== undefined && download.size > maxFileSizeBytes

    if (isDownloadSizeOverLimit) {
      stream.destroy()

      throw createFileTooLarge()
    }

    return { stream, expectedSize: download.size ?? statedSize }
  }
}
