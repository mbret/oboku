import { Readable } from "node:stream"
import { Logger } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { ProxiedDownloadUsagePostgresService } from "../features/postgres/proxied-download-usage-postgres.service.js"
import { ProxiedDownloadQuotaService } from "./proxied-download-quota.service.js"

const CHUNK_BYTES = 64 * 1024
const CHUNK_COUNT = 100
const FILE_BYTES = CHUNK_BYTES * CHUNK_COUNT

const createDriveStream = () =>
  Readable.from(
    Array.from({ length: CHUNK_COUNT }, () => Buffer.alloc(CHUNK_BYTES)),
  )

describe("ProxiedDownloadQuotaService", () => {
  let service: ProxiedDownloadQuotaService
  const reserveWithinQuotas = vi.fn()
  const adjust = vi.fn()

  beforeEach(async () => {
    reserveWithinQuotas.mockResolvedValue("reserved")
    adjust.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ProxiedDownloadQuotaService,
        {
          provide: ProxiedDownloadUsagePostgresService,
          useValue: { reserveWithinQuotas, adjust },
        },
        {
          provide: InstanceConfigService,
          useValue: {
            getConfig: () => ({
              value: {
                proxiedDownloadBytesMaxPerMonth: 1024 ** 4,
                proxiedDownloadUserQuota: { type: "percentage", percent: 100 },
              },
            }),
          },
        },
      ],
    }).compile()

    service = module.get(ProxiedDownloadQuotaService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("gives back the bytes a download cancelled midway did not pass on", async () => {
    const metered = await service.meter({
      userId: 1,
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
      userId: 1,
      stream: failingDriveStream,
      expectedBytes: FILE_BYTES,
      isBodySent: true,
    })

    if (metered.status !== "metered") throw new Error("expected a reservation")

    metered.stream.on("error", function ignoreDriveFailure() {})
    metered.stream.resume()

    await vi.waitFor(() =>
      expect(adjust).toHaveBeenCalledWith({
        userId: 1,
        month: expect.any(String),
        bytes: 2 * CHUNK_BYTES - FILE_BYTES,
      }),
    )
  })

  it("logs a settle that fails, without throwing", async () => {
    const logError = vi.spyOn(Logger.prototype, "error")
    adjust.mockRejectedValue(new Error("connection refused"))
    const metered = await service.meter({
      userId: 1,
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
    reserveWithinQuotas.mockRejectedValue(new Error("connection refused"))

    await expect(
      service.meter({
        userId: 1,
        stream: driveStream,
        expectedBytes: FILE_BYTES,
        isBodySent: true,
      }),
    ).rejects.toThrow("connection refused")
    expect(driveStream.destroyed).toBe(true)
  })
})
