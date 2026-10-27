import { Test } from "@nestjs/testing"
import {
  arrayBufferFileAccessors,
  createArchive,
} from "@prose-reader/archive-reader"
import sharp from "sharp"
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import { AppConfigService } from "../config/AppConfigService.js"
import { CoversFsService } from "./covers-fs.service.js"
import { CoversS3Service } from "./covers-s3.service.js"
import { CoversService } from "./covers.service.js"
import { saveCoverFromArchiveToBucket } from "./saveCoverFromArchiveToBucket.js"

const createJpeg = (size: { width: number; height: number }) =>
  sharp({
    create: { ...size, channels: 3, background: { r: 12, g: 34, b: 56 } },
  })
    .jpeg()
    .toBuffer()

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

describe("saveCoverFromArchiveToBucket", () => {
  let coversService: CoversService
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

    coversService = module.get(CoversService)
  })

  it("saves the image the cover link names", async () => {
    const archive = archiveOf({
      "images/page-1.jpg": await createJpeg({ width: 60, height: 90 }),
      "images/cover.jpg": await createJpeg({ width: 30, height: 45 }),
    })

    const saved = await saveCoverFromArchiveToBucket(
      "cover-key",
      archive,
      "images/cover.jpg",
      coversService,
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
      "images/page-1.jpg": await createJpeg({ width: 60, height: 90 }),
    })

    const saved = await saveCoverFromArchiveToBucket(
      "cover-key",
      archive,
      "images/cover.jpg",
      coversService,
    )

    expect(saved).toBe(false)
    expect(fsService.saveCover).not.toHaveBeenCalled()
  })

  it("saves nothing when the record is not an image", async () => {
    const archive = archiveOf({
      "images/cover.jpg": new TextEncoder().encode("not an image"),
    })

    const saved = await saveCoverFromArchiveToBucket(
      "cover-key",
      archive,
      "images/cover.jpg",
      coversService,
    )

    expect(saved).toBe(false)
    expect(fsService.saveCover).not.toHaveBeenCalled()
  })
})
