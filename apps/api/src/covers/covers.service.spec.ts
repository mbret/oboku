import type { Mock } from "vitest"
import { Test, type TestingModule } from "@nestjs/testing"
import {
  arrayBufferFileAccessors,
  createArchive,
} from "@prose-reader/archive-reader"
import path from "node:path"
import { firstValueFrom } from "rxjs"
import sharp from "sharp"
import { AppConfigService } from "../config/AppConfigService.js"
import { CoversFsService } from "./covers-fs.service.js"
import { CoversS3Service } from "./covers-s3.service.js"
import { CoversService } from "./covers.service.js"

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

const archiveOf = (entries: Record<string, Uint8Array>) =>
  createArchive({
    filename: "book.cbz",
    records: Object.entries(entries).map(function toRecord([uri, bytes]) {
      return {
        dir: false,
        basename: uri.split("/").pop() ?? uri,
        uri,
        size: bytes.byteLength,
        ...arrayBufferFileAccessors(function readBytes() {
          return Promise.resolve(new Uint8Array(bytes).buffer)
        }),
      }
    }),
    close: function closeArchive() {
      return Promise.resolve()
    },
  })

describe("CoversService", () => {
  let service: CoversService
  let fsService: { getCover: Mock }

  beforeEach(async () => {
    fsService = { getCover: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoversService,
        {
          provide: AppConfigService,
          useValue: {
            COVERS_STORAGE_STRATEGY: "fs",
            COVERS_MAXIMUM_SIZE_FOR_DELIVERY: DELIVERY_SIZE,
            COVERS_MAXIMUM_SIZE_FOR_STORAGE: { width: 400, height: 600 },
            ASSETS_DIR: path.join(import.meta.dirname, "..", "assets"),
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

    const { cover: delivered } = await firstValueFrom(
      service.getCoverForDelivery("key"),
    )

    expect(delivered).toBe(storedCover)
  })

  it("resizes a stored cover bigger than the delivery size", async () => {
    const storedCover = await createCover({
      width: 1200,
      height: 1800,
      format: "webp",
    })
    fsService.getCover.mockResolvedValue(storedCover)

    const { cover: delivered } = await firstValueFrom(
      service.getCoverForDelivery("key"),
    )
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

    const { cover: delivered } = await firstValueFrom(
      service.getCoverForDelivery("key", "image/jpeg"),
    )

    expect((await sharp(delivered).metadata()).format).toBe("jpeg")
  })

  it("encodes the placeholder once for a given format", async () => {
    fsService.getCover.mockResolvedValue(null)

    const { cover: first } = await firstValueFrom(
      service.getCoverForDelivery("key"),
    )
    const { cover: second } = await firstValueFrom(
      service.getCoverForDelivery("other"),
    )

    expect((await sharp(first).metadata()).format).toBe("webp")
    expect(second).toBe(first)
  })

  it("serves the webp placeholder for a format it cannot produce", async () => {
    fsService.getCover.mockResolvedValue(null)

    const { cover: webp } = await firstValueFrom(
      service.getCoverForDelivery("key"),
    )
    const { cover: unsupported } = await firstValueFrom(
      service.getCoverForDelivery("key", "image/png"),
    )

    expect(unsupported).toBe(webp)
  })
})

describe("CoversService.saveCoverFromArchive", () => {
  let service: CoversService
  let fsService: { saveCover: Mock }

  beforeEach(async function createCoversService() {
    fsService = { saveCover: vi.fn().mockResolvedValue(undefined) }

    const module = await Test.createTestingModule({
      providers: [
        CoversService,
        {
          provide: AppConfigService,
          useValue: {
            COVERS_STORAGE_STRATEGY: "fs",
            COVERS_MAXIMUM_SIZE_FOR_STORAGE: { width: 400, height: 600 },
          },
        },
        { provide: CoversFsService, useValue: fsService },
        { provide: CoversS3Service, useValue: {} },
      ],
    }).compile()

    service = module.get(CoversService)
  })

  it("saves the image the cover link names", async () => {
    const archive = archiveOf({
      "images/page-1.jpg": await createCover({
        width: 60,
        height: 90,
        format: "jpeg",
      }),
      "images/cover.jpg": await createCover({
        width: 30,
        height: 45,
        format: "jpeg",
      }),
    })

    const saved = await service.saveCoverFromArchive(
      "cover-key",
      archive,
      "images/cover.jpg",
    )

    expect(saved).toBe(true)
    expect(fsService.saveCover).toHaveBeenCalledOnce()
    const [storedCover, objectKey] = fsService.saveCover.mock.calls[0] ?? []
    expect(objectKey).toBe("cover-key")
    expect(await sharp(storedCover).metadata()).toMatchObject({
      width: 30,
      height: 45,
    })
  })

  it("saves nothing when no record sits at the cover link", async () => {
    const archive = archiveOf({
      "images/page-1.jpg": await createCover({
        width: 60,
        height: 90,
        format: "jpeg",
      }),
    })

    const saved = await service.saveCoverFromArchive(
      "cover-key",
      archive,
      "images/cover.jpg",
    )

    expect(saved).toBe(false)
    expect(fsService.saveCover).not.toHaveBeenCalled()
  })

  it("saves nothing when the record is not an image", async () => {
    const archive = archiveOf({
      "images/cover.jpg": new TextEncoder().encode("not an image"),
    })

    const saved = await service.saveCoverFromArchive(
      "cover-key",
      archive,
      "images/cover.jpg",
    )

    expect(saved).toBe(false)
    expect(fsService.saveCover).not.toHaveBeenCalled()
  })
})
