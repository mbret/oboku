import { Readable } from "node:stream"
import { Logger } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { StreamingUsagePostgresService } from "../features/postgres/streaming-usage-postgres.service.js"
import { StreamingUsageService } from "./streaming-usage.service.js"

const CHUNK_BYTES = 64 * 1024
const CHUNK_COUNT = 100
const FILE_BYTES = CHUNK_BYTES * CHUNK_COUNT

const createDriveStream = () =>
  Readable.from(
    Array.from({ length: CHUNK_COUNT }, () => Buffer.alloc(CHUNK_BYTES)),
  )

describe("StreamingUsageService", () => {
  let service: StreamingUsageService
  const reserveUnderCap = vi.fn()
  const adjust = vi.fn()

  beforeEach(async () => {
    reserveUnderCap.mockResolvedValue("reserved")
    adjust.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        StreamingUsageService,
        {
          provide: StreamingUsagePostgresService,
          useValue: { reserveUnderCap, adjust },
        },
        {
          provide: InstanceConfigService,
          useValue: {
            getConfig: () => ({
              value: { streamedBytesMaxPerMonth: 1024 ** 4 },
            }),
          },
        },
      ],
    }).compile()

    service = module.get(StreamingUsageService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("gives back the bytes a download cancelled midway did not pass on", async () => {
    const metered = await service.meter({
      stream: createDriveStream(),
      expectedBytes: FILE_BYTES,
      isBodySent: true,
    })

    if (metered.status !== "metered") throw new Error("expected a reservation")

    metered.stream.once("data", function cancelAfterFirstChunk() {
      metered.stream.destroy()
    })

    await vi.waitFor(() => expect(adjust).toHaveBeenCalledOnce())

    const [{ bytes: givenBackBytes }] = adjust.mock.lastCall ?? [{}]

    expect(givenBackBytes).toBeLessThan(0)
    expect(givenBackBytes).toBeGreaterThan(-FILE_BYTES)
  })

  it("gives back the bytes a Drive stream failing midway did not pass on", async () => {
    let pushedChunks = 0
    const failingDriveStream = new Readable({
      read() {
        if (pushedChunks === 2) {
          this.destroy(new Error("socket hang up"))

          return
        }

        pushedChunks += 1
        this.push(Buffer.alloc(CHUNK_BYTES))
      },
    })
    const metered = await service.meter({
      stream: failingDriveStream,
      expectedBytes: FILE_BYTES,
      isBodySent: true,
    })

    if (metered.status !== "metered") throw new Error("expected a reservation")

    metered.stream.on("error", function ignoreDriveFailure() {})
    metered.stream.resume()

    await vi.waitFor(() =>
      expect(adjust).toHaveBeenCalledWith({
        month: expect.any(String),
        bytes: 2 * CHUNK_BYTES - FILE_BYTES,
      }),
    )
  })

  it("logs a settle that fails, without throwing", async () => {
    const logError = vi.spyOn(Logger.prototype, "error")
    adjust.mockRejectedValue(new Error("connection refused"))
    const metered = await service.meter({
      stream: createDriveStream(),
      expectedBytes: undefined,
      isBodySent: true,
    })

    if (metered.status !== "metered") throw new Error("expected a reservation")

    metered.stream.resume()

    await vi.waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        `Could not count ${FILE_BYTES} streamed bytes: connection refused`,
      ),
    )
  })

  it("destroys the Drive stream when the counter cannot be reached", async () => {
    const driveStream = createDriveStream()
    reserveUnderCap.mockRejectedValue(new Error("connection refused"))

    await expect(
      service.meter({
        stream: driveStream,
        expectedBytes: FILE_BYTES,
        isBodySent: true,
      }),
    ).rejects.toThrow("connection refused")
    expect(driveStream.destroyed).toBe(true)
  })
})
