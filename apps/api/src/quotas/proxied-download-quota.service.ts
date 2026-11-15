import {
  pipeline,
  type Readable,
  Transform,
  type TransformCallback,
} from "node:stream"
import { Injectable, Logger } from "@nestjs/common"
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
    // The pipeline listens to the Drive stream before the reservation is
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
}
