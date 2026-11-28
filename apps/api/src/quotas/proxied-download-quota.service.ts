import {
  pipeline,
  Readable,
  Transform,
  type TransformCallback,
} from "node:stream"
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import type { Response } from "express"
import { toObokuErrorBody } from "../http/obokuBadRequest.js"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../admin/instance-config/instance-config.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import type {
  ProxiedDownloadQuotaResponseDto,
  UserProxiedDownloadQuotaResponseDto,
} from "./quotas.dto.js"

/**
 * Counts the bytes it passes on, read once the pipeline ends. A `compose`
 * with an async generator would keep the count in one scope, but it fails
 * with an `AbortError` when Nest destroys it after a HEAD answer, which
 * Nest's `StreamableFile` handles as a failed download.
 */
class ByteCountingStream extends Transform {
  passedBytes = 0

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    this.passedBytes += chunk.byteLength
    callback(null, chunk)
  }
}

/** The UTC month `date` falls in, as its counter's key, and when the next one starts. */
const toUsagePeriod = (date: Date) => ({
  month: `${date.toISOString().slice(0, 7)}-01`,
  resetsAt: new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  ),
})

const toUserQuotaBytes = ({
  proxiedDownloadBytesMaxPerMonth,
  proxiedDownloadUserQuota,
}: InstanceConfig) => {
  switch (proxiedDownloadUserQuota.type) {
    case "percentage":
      return Math.floor(
        (proxiedDownloadBytesMaxPerMonth * proxiedDownloadUserQuota.percent) /
          100,
      )
  }
}

export type MeteredStream =
  | { status: "metered"; stream: Readable }
  | { status: "quota-reached"; resetsAt: Date }

/** The headers of an answer that describe its file. */
export type FileHeaders = {
  "Content-Type"?: string
  "Content-Disposition"?: string
}

export type ProxiedFile = {
  stream: NodeJS.ReadableStream
  /** Written to the answer as they are. */
  headers: FileHeaders
  /** The number of bytes `stream` yields, when the source states it. */
  size?: number
  /** The bytes to reserve on the quotas: `size`, or else the size the file's metadata states. */
  expectedSize?: number
}

/** Keeps the files the instance passes on to users under its monthly quotas. */
@Injectable()
export class ProxiedDownloadQuotaService {
  private readonly logger = new Logger(ProxiedDownloadQuotaService.name)

  constructor(
    private readonly instanceConfigService: InstanceConfigService,
    private readonly proxiedDownloadUsagePostgresService: ProxiedDownloadUsagePostgresService,
  ) {}

  getInstanceUsage(): Promise<ProxiedDownloadQuotaResponseDto> {
    return this.findInstanceUsage(toUsagePeriod(new Date()))
  }

  async getUserUsage(
    userId: number,
  ): Promise<UserProxiedDownloadQuotaResponseDto> {
    const period = toUsagePeriod(new Date())
    const [instanceUsage, userUsedBytes] = await Promise.all([
      this.findInstanceUsage(period),
      this.proxiedDownloadUsagePostgresService.findUserBytes({
        userId,
        month: period.month,
      }),
    ])

    return {
      ...instanceUsage,
      userUsedBytes,
      userQuotaBytes: toUserQuotaBytes(
        this.instanceConfigService.getConfig().value,
      ),
    }
  }

  private async findInstanceUsage({
    month,
    resetsAt,
  }: ReturnType<
    typeof toUsagePeriod
  >): Promise<ProxiedDownloadQuotaResponseDto> {
    const usedBytes =
      await this.proxiedDownloadUsagePostgresService.findBytes(month)

    return {
      usedBytes,
      quotaBytes:
        this.instanceConfigService.getConfig().value
          .proxiedDownloadBytesMaxPerMonth,
      resetsAt: resetsAt.toISOString(),
    }
  }

  /**
   * Reserves `expectedBytes` on this month's counters of the instance and of
   * the user, then counts the bytes the returned stream passes on. Once it
   * ends, fails or is destroyed, the counters get the difference: bytes back
   * for a cancelled download, more for one longer than expected. A file of
   * unknown size reserves nothing, and only passes below the quotas.
   *
   * The count runs ahead of what the client received by what the streams
   * and the socket still buffer.
   *
   * @param isBodySent false for a HEAD request, whose body Node discards:
   * it gives the whole reservation back.
   * @returns `quota-reached`, the source destroyed, when the download would
   * pass either quota; `resetsAt` is when the next month starts, UTC.
   * @throws the counter's error, the source destroyed, when the reservation
   * fails.
   */
  async meter({
    userId,
    stream,
    expectedBytes,
    isBodySent,
  }: {
    userId: number
    stream: Readable
    expectedBytes: number | undefined
    isBodySent: boolean
  }): Promise<MeteredStream> {
    const { month, resetsAt } = toUsagePeriod(new Date())
    const reservedBytes = expectedBytes ?? 0
    const config = this.instanceConfigService.getConfig().value

    const byteCounter = new ByteCountingStream()
    // The pipeline listens to the source stream before the reservation is
    // awaited: an error emitted with no listener stops the process. Its own
    // error is the stream's, which the route answers.
    const transferEnded = new Promise<number>(function countUntilEnd(resolve) {
      pipeline(stream, byteCounter, function resolvePassedBytes() {
        resolve(byteCounter.passedBytes)
      })
    })

    const reservation = await this.proxiedDownloadUsagePostgresService
      .reserveWithinQuotas({
        userId,
        month,
        bytes: reservedBytes,
        quotaBytes: config.proxiedDownloadBytesMaxPerMonth,
        userQuotaBytes: toUserQuotaBytes(config),
      })
      .catch(function destroySourceOnFailedReservation(error: unknown) {
        stream.destroy()

        throw error
      })

    if (reservation === "quota-reached") {
      stream.destroy()

      return { status: "quota-reached", resetsAt }
    }

    const { proxiedDownloadUsagePostgresService, logger } = this

    void transferEnded.then(function settleReservation(passedBytes) {
      const sentBytes = isBodySent ? passedBytes : 0
      const unreservedBytes = sentBytes - reservedBytes

      if (unreservedBytes === 0) return

      return proxiedDownloadUsagePostgresService
        .adjust({ userId, month, bytes: unreservedBytes })
        .catch(function logFailedSettle(error: unknown) {
          logger.error(
            `Could not count ${unreservedBytes} streamed bytes: ${error instanceof Error ? error.message : "unknown error"}`,
          )
        })
    })

    return { status: "metered", stream: byteCounter }
  }

  /**
   * Answers a route with `file`, metered by {@link meter}.
   *
   * @throws a 429 with `Retry-After` set to the start of the next month, UTC,
   * and `ERROR_PROXIED_DOWNLOAD_QUOTA_REACHED`, when the download would pass
   * either quota.
   * @returns a file that answers 502 with
   * `ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE` when the source's stream
   * fails before its first byte.
   */
  async deliver({
    userId,
    file,
    isBodySent,
    response,
  }: {
    userId: number
    file: ProxiedFile
    /** False for a HEAD request, see {@link meter}. */
    isBodySent: boolean
    response: Response
  }): Promise<StreamableFile> {
    const meteredFile = await this.meter({
      userId,
      stream:
        file.stream instanceof Readable
          ? file.stream
          : Readable.from(file.stream),
      expectedBytes: file.expectedSize,
      isBodySent,
    })

    if (meteredFile.status === "quota-reached") {
      response.setHeader("Retry-After", meteredFile.resetsAt.toUTCString())

      throw new HttpException(
        toObokuErrorBody(ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_QUOTA_REACHED),
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    for (const [name, value] of Object.entries(file.headers)) {
      if (value !== undefined) response.setHeader(name, value)
    }

    const streamableFile = new StreamableFile(meteredFile.stream, {
      length: file.size,
    })
    const handleStreamFailure = streamableFile.errorHandler

    // Nest answers 400 for a stream that fails before its first byte; the
    // source failed, not the request.
    return streamableFile.setErrorHandler(
      function answerBadGatewayBeforeFirstByte(error, streamResponse) {
        const isAnswerStarted =
          streamResponse.destroyed || streamResponse.headersSent

        if (isAnswerStarted) {
          handleStreamFailure(error, streamResponse)

          return
        }

        // `streamResponse` is `response`, typed with `send` only.
        response.removeHeader("Content-Disposition")
        response
          .status(HttpStatus.BAD_GATEWAY)
          .type("json")
          .json(
            toObokuErrorBody(
              ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
            ),
          )
      },
    )
  }
}
