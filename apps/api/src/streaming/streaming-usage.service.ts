import {
  pipeline,
  type Readable,
  Transform,
  type TransformCallback,
} from "node:stream"
import { Injectable, Logger } from "@nestjs/common"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { StreamingUsagePostgresService } from "../features/postgres/streaming-usage-postgres.service.js"

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

const toUsageMonth = (date: Date) => `${date.toISOString().slice(0, 7)}-01`

const toNextUsageMonthStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))

export type MeteredStream =
  | { status: "metered"; stream: Readable }
  | { status: "cap-reached"; resetsAt: Date }

/** Keeps what the instance streams to users under its monthly cap. */
@Injectable()
export class StreamingUsageService {
  private readonly logger = new Logger(StreamingUsageService.name)

  constructor(
    private readonly instanceConfigService: InstanceConfigService,
    private readonly streamingUsagePostgresService: StreamingUsagePostgresService,
  ) {}

  /**
   * Reserves `expectedBytes` on this month's counter, then counts the bytes
   * the returned stream passes on. Once it ends, fails or is destroyed, the
   * counter gets the difference: bytes back for a cancelled download, more
   * for one longer than expected. A file of unknown size reserves nothing,
   * and only passes below the cap.
   *
   * The count runs ahead of what the client received by what the streams
   * and the socket still buffer.
   *
   * @param isBodySent false for a HEAD request, whose body Node discards:
   * it gives the whole reservation back.
   * @returns `cap-reached`, the source destroyed, when the download would
   * pass the cap; `resetsAt` is when the next month starts, UTC.
   */
  async meter({
    stream,
    expectedBytes,
    isBodySent,
  }: {
    stream: Readable
    expectedBytes: number | undefined
    isBodySent: boolean
  }): Promise<MeteredStream> {
    const now = new Date()
    const month = toUsageMonth(now)
    const reservedBytes = expectedBytes ?? 0
    const { streamedBytesMaxPerMonth } =
      this.instanceConfigService.getConfig().value

    const byteCounter = new ByteCountingStream()
    // The pipeline listens to the Drive stream before the reservation is
    // awaited: an error emitted with no listener stops the process. Its own
    // error is the stream's, which the route answers.
    const transferEnded = new Promise<number>(function countUntilEnd(resolve) {
      pipeline(stream, byteCounter, function resolvePassedBytes() {
        resolve(byteCounter.passedBytes)
      })
    })

    const reservation = await this.streamingUsagePostgresService
      .reserveUnderCap({
        month,
        bytes: reservedBytes,
        capBytes: streamedBytesMaxPerMonth,
      })
      .catch(function destroySourceOnFailedReservation(error: unknown) {
        stream.destroy()

        throw error
      })

    if (reservation === "cap-reached") {
      stream.destroy()

      return { status: "cap-reached", resetsAt: toNextUsageMonthStart(now) }
    }

    const { streamingUsagePostgresService, logger } = this

    void transferEnded.then(function settleReservation(passedBytes) {
      const sentBytes = isBodySent ? passedBytes : 0
      const unreservedBytes = sentBytes - reservedBytes

      if (unreservedBytes === 0) return

      return streamingUsagePostgresService
        .adjust({ month, bytes: unreservedBytes })
        .catch(function logFailedSettle(error: unknown) {
          logger.error(
            `Could not count ${unreservedBytes} streamed bytes: ${error instanceof Error ? error.message : "unknown error"}`,
          )
        })
    })

    return { status: "metered", stream: byteCounter }
  }
}
