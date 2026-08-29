import { Test, type TestingModule } from "@nestjs/testing"
import path from "node:path"
import { firstValueFrom } from "rxjs"
import sharp from "sharp"
import { AppConfigService } from "src/config/AppConfigService"
import { CoversFsService } from "./covers-fs.service"
import { CoversS3Service } from "./covers-s3.service"
import { CoversService } from "./covers.service"

const DELIVERY_SIZE = { width: 600, height: 600 }

const createCover = ({
  width,
  height,
  format,
}: {
  width: number
  height: number
  format: "webp" | "jpeg"
}) => {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 12, g: 34, b: 56 },
    },
  })

  return (format === "webp" ? image.webp() : image.jpeg()).toBuffer()
}

describe("CoversService", () => {
  let service: CoversService
  let fsService: { getCover: jest.Mock }

  beforeEach(async () => {
    fsService = { getCover: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoversService,
        {
          provide: AppConfigService,
          useValue: {
            COVERS_STORAGE_STRATEGY: "fs",
            COVERS_MAXIMUM_SIZE_FOR_DELIVERY: DELIVERY_SIZE,
            COVERS_MAXIMUM_SIZE_FOR_STORAGE: { width: 400, height: 600 },
            ASSETS_DIR: path.join(__dirname, "..", "assets"),
          },
        },
        { provide: CoversFsService, useValue: fsService },
        { provide: CoversS3Service, useValue: {} },
      ],
    }).compile()

    service = module.get<CoversService>(CoversService)
  })

  it("delivers a stored webp within the delivery size untouched", async () => {
    const storedCover = await createCover({
      width: 400,
      height: 600,
      format: "webp",
    })
    fsService.getCover.mockResolvedValue(storedCover)

    const delivered = await firstValueFrom(service.getCoverForDelivery("key"))

    expect(delivered).toBe(storedCover)
  })

  it("resizes a stored cover bigger than the delivery size", async () => {
    const storedCover = await createCover({
      width: 1200,
      height: 1800,
      format: "webp",
    })
    fsService.getCover.mockResolvedValue(storedCover)

    const delivered = await firstValueFrom(service.getCoverForDelivery("key"))
    const metadata = await sharp(delivered).metadata()

    expect(metadata.width).toBeLessThanOrEqual(DELIVERY_SIZE.width)
    expect(metadata.height).toBeLessThanOrEqual(DELIVERY_SIZE.height)
  })

  it("converts a stored webp when another format is requested", async () => {
    const storedCover = await createCover({
      width: 400,
      height: 600,
      format: "webp",
    })
    fsService.getCover.mockResolvedValue(storedCover)

    const delivered = await firstValueFrom(
      service.getCoverForDelivery("key", "image/jpeg"),
    )

    expect((await sharp(delivered).metadata()).format).toBe("jpeg")
  })

  it("encodes the placeholder once for a given format", async () => {
    fsService.getCover.mockResolvedValue(null)

    const first = await firstValueFrom(service.getCoverForDelivery("key"))
    const second = await firstValueFrom(service.getCoverForDelivery("other"))

    expect((await sharp(first).metadata()).format).toBe("webp")
    expect(second).toBe(first)
  })
})
