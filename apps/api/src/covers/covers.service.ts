import { Injectable, Logger } from "@nestjs/common"
import axios from "axios"
import type { Extractor } from "node-unrar-js"
import { firstValueFrom, from, switchMap, tap } from "rxjs"
import sharp from "sharp"
import unzipper from "unzipper"
import { AppConfigService } from "src/config/AppConfigService"
import fs from "node:fs"
import path from "node:path"
import { CoversFsService } from "./covers-fs.service"
import { CoversS3Service } from "./covers-s3.service"

const WEBP_MIME_TYPE = "image/webp"
const JPEG_MIME_TYPE = "image/jpeg"

type DeliveryFormat = typeof WEBP_MIME_TYPE | typeof JPEG_MIME_TYPE

const isDeliveryFormat = (format: string): format is DeliveryFormat =>
  format === WEBP_MIME_TYPE || format === JPEG_MIME_TYPE

const resolveDeliveryFormat = (format?: string): DeliveryFormat =>
  format && isDeliveryFormat(format) ? format : WEBP_MIME_TYPE

const isUnsupportedImageFormatError = (error: unknown) =>
  error instanceof Error &&
  error.message === "Input buffer contains unsupported image format"

export type StoredCover = {
  key: string
  sizeInBytes: number
  lastModifiedAt: string | null
}

@Injectable()
export class CoversService {
  private readonly logger = new Logger(CoversService.name)
  private deliverablePlaceholders = new Map<DeliveryFormat, Promise<Buffer>>()

  constructor(
    public appConfig: AppConfigService,
    private fsService: CoversFsService,
    private s3Service: CoversS3Service,
  ) {}

  private get backend() {
    return this.appConfig.COVERS_STORAGE_STRATEGY === "s3"
      ? this.s3Service
      : this.fsService
  }

  private getDeliverablePlaceholder(format: DeliveryFormat) {
    const alreadyEncoded = this.deliverablePlaceholders.get(format)

    if (alreadyEncoded) return alreadyEncoded

    const encodePlaceholder = (placeholder: Buffer) =>
      firstValueFrom(
        this.resizeCover(placeholder, {
          ...this.appConfig.COVERS_MAXIMUM_SIZE_FOR_DELIVERY,
          format,
        }),
      )

    const forgetFailedEncoding = (error: unknown) => {
      this.deliverablePlaceholders.delete(format)

      throw error
    }

    const encoding = fs.promises
      .readFile(path.join(this.appConfig.ASSETS_DIR, "cover-placeholder.jpg"))
      .then(encodePlaceholder)
      .catch(forgetFailedEncoding)

    this.deliverablePlaceholders.set(format, encoding)

    return encoding
  }

  private async isDeliverableAsIs(
    cover: Uint8Array<ArrayBufferLike>,
    format: DeliveryFormat,
  ) {
    if (format !== WEBP_MIME_TYPE) return false

    const maximumSize = this.appConfig.COVERS_MAXIMUM_SIZE_FOR_DELIVERY
    const metadata = await sharp(cover).metadata()

    return (
      metadata.format === "webp" &&
      metadata.width <= maximumSize.width &&
      metadata.height <= maximumSize.height
    )
  }

  private async deliverStoredCover(
    cover: Uint8Array<ArrayBufferLike>,
    format: DeliveryFormat,
  ) {
    if (await this.isDeliverableAsIs(cover, format)) return cover

    return firstValueFrom(
      this.resizeCover(cover, {
        ...this.appConfig.COVERS_MAXIMUM_SIZE_FOR_DELIVERY,
        format,
      }),
    )
  }

  /**
   * Cover bytes ready to be sent as `format`. Stored covers are already webp
   * and capped at `COVERS_MAXIMUM_SIZE_FOR_STORAGE`, so they are delivered as
   * they are and only a format or size mismatch pays for a re-encode. A format
   * the service cannot produce is served as webp.
   */
  getCoverForDelivery(id: string, format?: string) {
    const deliveryFormat = resolveDeliveryFormat(format)

    const deliverStoredCoverOrPlaceholder = (
      cover: Uint8Array<ArrayBufferLike> | null,
    ) =>
      cover
        ? this.deliverStoredCover(cover, deliveryFormat)
        : this.getDeliverablePlaceholder(deliveryFormat)

    return from(this.backend.getCover(id)).pipe(
      switchMap(deliverStoredCoverOrPlaceholder),
    )
  }

  saveCover(cover: Uint8Array<ArrayBufferLike>, objectKey: string) {
    const resized$ = this.resizeCover(cover, {
      width: this.appConfig.COVERS_MAXIMUM_SIZE_FOR_STORAGE.width,
      height: this.appConfig.COVERS_MAXIMUM_SIZE_FOR_STORAGE.height,
      format: "image/webp",
    })

    return resized$.pipe(
      switchMap((resized) =>
        from(this.backend.saveCover(resized, objectKey)).pipe(
          tap(() => {
            const coverSize = Buffer.byteLength(resized)

            this.logger.debug(
              `Saved cover ${objectKey} with a size of ${(coverSize / 1024).toFixed(2)} KB`,
            )
          }),
        ),
      ),
    )
  }

  async saveCoverFromUrl(objectKey: string, url: string): Promise<boolean> {
    this.logger.log(`prepare to save cover ${objectKey}`)

    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      })

      await firstValueFrom(
        this.saveCover(Buffer.from(response.data), objectKey),
      )

      this.logger.log(`cover ${objectKey} has been saved/updated`)

      return true
    } catch (error) {
      this.logger.error(error)

      return false
    }
  }

  async saveCoverFromRarEntry(
    objectKey: string,
    extractor: Extractor<Uint8Array>,
    entryPath: string,
  ): Promise<boolean> {
    this.logger.log(`prepare to save cover ${objectKey}`)

    try {
      const extracted = extractor.extract({ files: [entryPath] })
      const files = [...extracted.files] // need to iterate till the end to release memory
      const entry = files[0]

      if (!entry?.extraction) return false

      await firstValueFrom(
        this.saveCover(Buffer.from(entry.extraction), objectKey),
      )

      this.logger.log(`cover ${objectKey} has been saved/updated`)

      return true
    } catch (error) {
      this.logger.error(error)

      return false
    }
  }

  async saveCoverFromZipEntry(
    objectKey: string,
    archivePath: string,
    entryPath: string,
  ): Promise<boolean> {
    if (entryPath === "") {
      this.logger.error(
        `coverPath is empty string, ignoring process`,
        objectKey,
      )

      return false
    }

    this.logger.log(`prepare to save cover ${objectKey}`)

    const zip = fs
      .createReadStream(archivePath)
      .pipe(unzipper.Parse({ forceStream: true }))

    let saved = false

    try {
      for await (const entry of zip) {
        if (entry.path !== entryPath) {
          entry.autodrain()
          continue
        }

        await firstValueFrom(this.saveCover(await entry.buffer(), objectKey))

        this.logger.log(`cover ${objectKey} has been saved/updated`)

        saved = true
      }

      return saved
    } catch (error) {
      if (isUnsupportedImageFormatError(error)) {
        this.logger.error(
          `It seems input is not a valid image. This can happens when for example the file is encrypted or something else went wrong during archive extraction`,
          error,
        )

        return false
      }

      this.logger.error(error)

      return false
    }
  }

  isCoverExist(objectKey: string) {
    return from(this.backend.isCoverExist(objectKey))
  }

  async deleteCovers(keys: string[]) {
    return this.backend.deleteCovers(keys)
  }

  async listStoredCovers(): Promise<StoredCover[]> {
    return this.backend.listStoredCovers()
  }

  getStorageLocation() {
    return this.backend.getStorageLocation()
  }

  resizeCover(
    cover: Uint8Array<ArrayBufferLike>,
    {
      height,
      width,
      format,
    }: { width: number; height: number; format: DeliveryFormat },
  ) {
    const resized = sharp(cover).resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })

    const converted =
      format === JPEG_MIME_TYPE
        ? resized.toFormat("jpeg").jpeg({
            force: true,
          })
        : resized.webp()

    return from(converted.toBuffer())
  }
}
